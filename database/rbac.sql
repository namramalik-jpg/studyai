-- StudyAI RBAC migration
-- 1. Run this in Supabase SQL Editor.
-- 2. Replace your-email@example.com with your real admin email.

alter table public.profiles
  add column if not exists role text;

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'user'
where role is null or role = 'student';

alter table public.profiles
  alter column role set default 'user',
  alter column role set not null;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

update public.profiles
set role = 'admin'
where email = 'your-email@example.com';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    'user'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null then
      new.role := 'user';
    end if;

    if new.role <> 'user' and not public.is_admin() then
      new.role := 'user';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_role on public.profiles;
create trigger enforce_profile_role
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_role();

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.summaries enable row level security;
alter table public.questions enable row level security;
alter table public.ai_history enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Users can read own notes" on public.notes;
create policy "Users can read own notes"
  on public.notes for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can read own summaries" on public.summaries;
create policy "Users can read own summaries"
  on public.summaries for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can read own questions" on public.questions;
create policy "Users can read own questions"
  on public.questions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can read own AI history" on public.ai_history;
create policy "Users can read own AI history"
  on public.ai_history for select
  using (auth.uid() = user_id or public.is_admin());

notify pgrst, 'reload schema';

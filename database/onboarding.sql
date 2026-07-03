-- StudyAI onboarding migration
-- Run this in Supabase SQL Editor.

alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

update public.profiles
set has_completed_onboarding = false
where has_completed_onboarding is null;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

notify pgrst, 'reload schema';

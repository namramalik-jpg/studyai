-- StudyAI AI Quiz migration
-- Run this in the Supabase SQL Editor before saving AI quiz results.

alter table public.quiz_history
  alter column note_id drop not null,
  add column if not exists topic text,
  add column if not exists difficulty text not null default 'medium',
  add column if not exists total_questions integer not null default 5;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_history_difficulty_check'
  ) then
    alter table public.quiz_history
      add constraint quiz_history_difficulty_check
      check (difficulty in ('easy', 'medium', 'hard'));
  end if;
end $$;

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

alter table public.quiz_history enable row level security;

drop policy if exists "Users can read own quiz history" on public.quiz_history;
create policy "Users can read own quiz history"
  on public.quiz_history for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own quiz history" on public.quiz_history;
create policy "Users can insert own quiz history"
  on public.quiz_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own quiz history" on public.quiz_history;
create policy "Users can update own quiz history"
  on public.quiz_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own quiz history" on public.quiz_history;
create policy "Users can delete own quiz history"
  on public.quiz_history for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

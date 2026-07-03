-- Run this in Supabase SQL Editor for the StudyAI Settings page.
-- Stores notification and AI defaults per authenticated user.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  ai_completion_notifications boolean not null default true,
  product_updates boolean not null default false,
  weekly_study_reminder boolean not null default true,
  default_ai_feature text not null default 'notes' check (default_ai_feature in ('notes', 'summary', 'quiz', 'flashcards')),
  default_quiz_difficulty text not null default 'medium' check (default_quiz_difficulty in ('easy', 'medium', 'hard')),
  default_language text not null default 'english' check (default_language in ('english', 'urdu')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.user_preferences;
create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own preferences" on public.user_preferences;
create policy "Users can delete own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

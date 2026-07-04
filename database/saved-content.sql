-- StudyAI saved content migration
-- Run this in the Supabase SQL Editor if notes, summaries, questions, or flashcards are not saving.

create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text,
  generated_notes text,
  content text not null,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_public boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes
  add column if not exists prompt text,
  add column if not exists generated_notes text,
  add column if not exists content text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_public boolean not null default false,
  add column if not exists share_token text unique,
  add column if not exists updated_at timestamptz not null default now();

update public.notes
set content = coalesce(content, generated_notes, '')
where content is null;

alter table public.notes
  alter column content set not null,
  alter column tags set default '{}',
  alter column tags set not null,
  alter column is_pinned set default false,
  alter column is_pinned set not null,
  alter column is_public set default false,
  alter column is_public set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  original_text text,
  generated_summary text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.summaries
  add column if not exists original_text text,
  add column if not exists generated_summary text,
  add column if not exists content text;

update public.summaries
set content = coalesce(content, generated_summary, '')
where content is null;

alter table public.summaries
  alter column content set not null;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  flashcards_json jsonb not null,
  total_cards integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references public.notes(id) on delete cascade,
  front_text text not null,
  back_text text not null,
  created_at timestamptz not null default now()
);

alter table public.flashcard_decks
  add column if not exists topic text,
  add column if not exists flashcards_json jsonb,
  add column if not exists total_cards integer not null default 10;

update public.flashcard_decks
set flashcards_json = coalesce(flashcards_json, '{"cards":[]}'::jsonb)
where flashcards_json is null;

update public.flashcard_decks
set topic = 'Study Flashcards'
where topic is null or btrim(topic) = '';

alter table public.flashcard_decks
  alter column topic set not null,
  alter column flashcards_json set not null,
  alter column total_cards set default 10,
  alter column total_cards set not null;

alter table public.flashcards
  alter column note_id drop not null;

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

create index if not exists summaries_user_created_idx
  on public.summaries (user_id, created_at desc);

create index if not exists questions_user_created_idx
  on public.questions (user_id, created_at desc);

create index if not exists flashcard_decks_user_created_idx
  on public.flashcard_decks (user_id, created_at desc);

create index if not exists flashcards_user_created_idx
  on public.flashcards (user_id, created_at desc);

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

alter table public.notes enable row level security;
alter table public.summaries enable row level security;
alter table public.questions enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

drop policy if exists "Users can read own notes" on public.notes;
create policy "Users can read own notes"
  on public.notes for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own summaries" on public.summaries;
create policy "Users can read own summaries"
  on public.summaries for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own summaries" on public.summaries;
create policy "Users can insert own summaries"
  on public.summaries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own summaries" on public.summaries;
create policy "Users can update own summaries"
  on public.summaries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own summaries" on public.summaries;
create policy "Users can delete own summaries"
  on public.summaries for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own questions" on public.questions;
create policy "Users can read own questions"
  on public.questions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own questions" on public.questions;
create policy "Users can insert own questions"
  on public.questions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own questions" on public.questions;
create policy "Users can delete own questions"
  on public.questions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own flashcard decks" on public.flashcard_decks;
create policy "Users can read own flashcard decks"
  on public.flashcard_decks for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own flashcard decks" on public.flashcard_decks;
create policy "Users can insert own flashcard decks"
  on public.flashcard_decks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcard decks" on public.flashcard_decks;
create policy "Users can update own flashcard decks"
  on public.flashcard_decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcard decks" on public.flashcard_decks;
create policy "Users can delete own flashcard decks"
  on public.flashcard_decks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own flashcards" on public.flashcards;
create policy "Users can read own flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own flashcards" on public.flashcards;
create policy "Users can insert own flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcards" on public.flashcards;
create policy "Users can update own flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcards" on public.flashcards;
create policy "Users can delete own flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

-- StudyAI AI Flashcards migration
-- Run this in the Supabase SQL Editor before saving generated flashcard decks.

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  flashcards_json jsonb not null,
  total_cards integer not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists flashcard_decks_user_created_idx
  on public.flashcard_decks (user_id, created_at desc);

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

alter table public.flashcard_decks enable row level security;

drop policy if exists "Users can read own flashcard decks" on public.flashcard_decks;
create policy "Users can read own flashcard decks"
  on public.flashcard_decks for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own flashcard decks" on public.flashcard_decks;
create policy "Users can insert own flashcard decks"
  on public.flashcard_decks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcard decks" on public.flashcard_decks;
create policy "Users can delete own flashcard decks"
  on public.flashcard_decks for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

-- Run this in Supabase SQL Editor if your project was created before
-- the unified Saved Notes page was added.
-- It allows users to rename their own saved summaries and flashcard decks.

alter table public.summaries enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Users can update own summaries" on public.summaries;
create policy "Users can update own summaries"
  on public.summaries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcard decks" on public.flashcard_decks;
create policy "Users can update own flashcard decks"
  on public.flashcard_decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

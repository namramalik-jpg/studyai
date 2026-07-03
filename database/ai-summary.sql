-- StudyAI AI Summary migration
-- Run this in the Supabase SQL Editor before saving generated summaries.

alter table public.summaries
  add column if not exists original_text text,
  add column if not exists generated_summary text;

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

update public.summaries
set generated_summary = content
where generated_summary is null
  and content is not null;

alter table public.summaries enable row level security;

drop policy if exists "Users can read own summaries" on public.summaries;
create policy "Users can read own summaries"
  on public.summaries for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own summaries" on public.summaries;
create policy "Users can insert own summaries"
  on public.summaries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own summaries" on public.summaries;
create policy "Users can delete own summaries"
  on public.summaries for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

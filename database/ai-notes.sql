-- StudyAI AI Notes migration
-- Run this in the Supabase SQL Editor before saving generated AI notes.

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

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

create index if not exists notes_user_pinned_created_idx
  on public.notes (user_id, is_pinned desc, created_at desc);

create index if not exists notes_tags_idx
  on public.notes using gin (tags);

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

update public.notes
set generated_notes = content
where generated_notes is null
  and content is not null;

alter table public.notes enable row level security;

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

notify pgrst, 'reload schema';

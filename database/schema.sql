create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'admin')),
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
  add column if not exists full_name text not null default '',
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists role text,
  add column if not exists has_completed_onboarding boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table profiles
      drop constraint profiles_role_check;
  end if;
end $$;

update profiles
set role = 'user'
where role is null or role = 'student';

alter table profiles
  alter column role set default 'user',
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end $$;

create table if not exists notes (
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

alter table notes
  add column if not exists prompt text,
  add column if not exists generated_notes text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_public boolean not null default false,
  add column if not exists share_token text unique,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  original_text text,
  generated_summary text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table summaries
  add column if not exists original_text text,
  add column if not exists generated_summary text;

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid references notes(id) on delete cascade,
  topic text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  total_questions integer not null default 5,
  quiz_data jsonb not null,
  score integer,
  created_at timestamptz not null default now()
);

alter table quiz_history
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
    alter table quiz_history
      add constraint quiz_history_difficulty_check
      check (difficulty in ('easy', 'medium', 'hard'));
  end if;
end $$;

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references notes(id) on delete cascade,
  front_text text not null,
  back_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  flashcards_json jsonb not null,
  total_cards integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists study_planner (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists ai_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  prompt text not null,
  response text not null,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null default 'study_item',
  item_id uuid,
  title text not null default 'Saved item',
  created_at timestamptz not null default now()
);

create table if not exists user_preferences (
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

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_created_idx
  on notes (user_id, created_at desc);

create index if not exists notes_user_pinned_created_idx
  on notes (user_id, is_pinned desc, created_at desc);

create index if not exists notes_tags_idx
  on notes using gin (tags);

create index if not exists notes_share_token_idx
  on notes (share_token)
  where share_token is not null;

create index if not exists summaries_user_created_idx
  on summaries (user_id, created_at desc);

create index if not exists questions_user_created_idx
  on questions (user_id, created_at desc);

create index if not exists quiz_history_user_created_idx
  on quiz_history (user_id, created_at desc);

create index if not exists flashcards_user_created_idx
  on flashcards (user_id, created_at desc);

create index if not exists flashcards_note_idx
  on flashcards (note_id, created_at desc);

create index if not exists flashcard_decks_user_created_idx
  on flashcard_decks (user_id, created_at desc);

create index if not exists study_planner_user_due_idx
  on study_planner (user_id, due_date asc);

create index if not exists ai_history_user_created_idx
  on ai_history (user_id, created_at desc);

create index if not exists favorites_user_created_idx
  on favorites (user_id, created_at desc);

create index if not exists chat_sessions_user_updated_idx
  on chat_sessions (user_id, updated_at desc);

create index if not exists chat_messages_chat_created_idx
  on chat_messages (chat_id, created_at asc);

create index if not exists chat_messages_user_created_idx
  on chat_messages (user_id, created_at desc);

alter table profiles enable row level security;
alter table notes enable row level security;
alter table summaries enable row level security;
alter table questions enable row level security;
alter table quiz_history enable row level security;
alter table flashcards enable row level security;
alter table flashcard_decks enable row level security;
alter table study_planner enable row level security;
alter table ai_history enable row level security;
alter table favorites enable row level security;
alter table user_preferences enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, bio, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    '',
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

drop trigger if exists enforce_profile_role on profiles;
create trigger enforce_profile_role
  before insert or update on profiles
  for each row
  execute function public.enforce_profile_role();

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_notes_updated_at on notes;
create trigger set_notes_updated_at
  before update on notes
  for each row
  execute function set_updated_at();

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

drop trigger if exists set_user_preferences_updated_at on user_preferences;
create trigger set_user_preferences_updated_at
  before update on user_preferences
  for each row
  execute function set_updated_at();

drop trigger if exists set_chat_sessions_updated_at on chat_sessions;
create trigger set_chat_sessions_updated_at
  before update on chat_sessions
  for each row
  execute function set_updated_at();

alter table notes replica identity full;

do $$
begin
  alter publication supabase_realtime add table notes;
exception
  when duplicate_object then null;
end $$;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Users can read own notes" on notes;
create policy "Users can read own notes"
  on notes for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own notes" on notes;
create policy "Users can insert own notes"
  on notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on notes;
create policy "Users can update own notes"
  on notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on notes;
create policy "Users can delete own notes"
  on notes for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own summaries" on summaries;
create policy "Users can read own summaries"
  on summaries for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own summaries" on summaries;
create policy "Users can insert own summaries"
  on summaries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own summaries" on summaries;
create policy "Users can delete own summaries"
  on summaries for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update own summaries" on summaries;
create policy "Users can update own summaries"
  on summaries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own questions" on questions;
create policy "Users can read own questions"
  on questions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own questions" on questions;
create policy "Users can insert own questions"
  on questions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own questions" on questions;
create policy "Users can delete own questions"
  on questions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own quiz history" on quiz_history;
create policy "Users can read own quiz history"
  on quiz_history for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own quiz history" on quiz_history;
create policy "Users can insert own quiz history"
  on quiz_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own quiz history" on quiz_history;
create policy "Users can update own quiz history"
  on quiz_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own quiz history" on quiz_history;
create policy "Users can delete own quiz history"
  on quiz_history for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own flashcards" on flashcards;
create policy "Users can read own flashcards"
  on flashcards for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own flashcards" on flashcards;
create policy "Users can insert own flashcards"
  on flashcards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcards" on flashcards;
create policy "Users can update own flashcards"
  on flashcards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcards" on flashcards;
create policy "Users can delete own flashcards"
  on flashcards for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own flashcard decks" on flashcard_decks;
create policy "Users can read own flashcard decks"
  on flashcard_decks for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own flashcard decks" on flashcard_decks;
create policy "Users can insert own flashcard decks"
  on flashcard_decks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcard decks" on flashcard_decks;
create policy "Users can update own flashcard decks"
  on flashcard_decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcard decks" on flashcard_decks;
create policy "Users can delete own flashcard decks"
  on flashcard_decks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own study tasks" on study_planner;
create policy "Users can read own study tasks"
  on study_planner for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own study tasks" on study_planner;
create policy "Users can insert own study tasks"
  on study_planner for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own study tasks" on study_planner;
create policy "Users can update own study tasks"
  on study_planner for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own study tasks" on study_planner;
create policy "Users can delete own study tasks"
  on study_planner for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own AI history" on ai_history;
create policy "Users can read own AI history"
  on ai_history for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own AI history" on ai_history;
create policy "Users can insert own AI history"
  on ai_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own AI history" on ai_history;
create policy "Users can delete own AI history"
  on ai_history for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own favorites" on favorites;
create policy "Users can read own favorites"
  on favorites for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own favorites" on favorites;
create policy "Users can insert own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on favorites;
create policy "Users can delete own favorites"
  on favorites for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own preferences" on user_preferences;
create policy "Users can read own preferences"
  on user_preferences for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own preferences" on user_preferences;
create policy "Users can insert own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on user_preferences;
create policy "Users can update own preferences"
  on user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own preferences" on user_preferences;
create policy "Users can delete own preferences"
  on user_preferences for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own chat sessions" on chat_sessions;
create policy "Users can read own chat sessions"
  on chat_sessions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own chat sessions" on chat_sessions;
create policy "Users can insert own chat sessions"
  on chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat sessions" on chat_sessions;
create policy "Users can update own chat sessions"
  on chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat sessions" on chat_sessions;
create policy "Users can delete own chat sessions"
  on chat_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own chat messages" on chat_messages;
create policy "Users can read own chat messages"
  on chat_messages for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own chat messages" on chat_messages;
create policy "Users can insert own chat messages"
  on chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from chat_sessions
      where chat_sessions.id = chat_messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own chat messages" on chat_messages;
create policy "Users can delete own chat messages"
  on chat_messages for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Users can read avatars" on storage.objects;
create policy "Users can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';

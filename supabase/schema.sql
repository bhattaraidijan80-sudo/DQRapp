-- ============================================================================
-- DQR (Dijan Quiz Rankings) — Supabase PostgreSQL Schema & Storage Buckets
-- Run this script once in your Supabase SQL Editor:
-- https://supabase.com/dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Core DQR Users Table (Username + 4-9 Digit PIN)
create table if not exists public.dqr_users (
  id text primary key,
  username text unique not null,
  pin text not null check (pin ~ '^[0-9]{4,9}$'),
  full_name text not null,
  role text not null check (role in ('admin', 'member')),
  created_at text not null,
  photo_url text,
  bio text default '',
  favourite_topic text default '',
  is_online boolean default false,
  last_logged_in text default '',
  xp integer default 500,
  level integer default 1,
  rank_id text default 'rk-g4',
  streak integer default 1,
  tagline text default '',
  announcement text default '',
  announcement_checked boolean default false,
  owned_title_ids jsonb default '[]'::jsonb,
  equipped_title_id text,
  achievement_ids jsonb default '[]'::jsonb,
  equipped_achievement_ids jsonb default '[]'::jsonb,
  report_card jsonb default '{}'::jsonb
);

-- 2. App State Sync Store (keeps Introduction, Hall of Fame, Ascension, Territories, Newspaper & System synced in real time)
create table if not exists public.dqr_app_store (
  store_key text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- 3. Individual Relational Tables (for structured queries & reporting)
create table if not exists public.dqr_quizzes (
  id text primary key,
  quiz_name text not null,
  year_bs text not null,
  position text not null,
  host text not null,
  players jsonb not null default '[]'::jsonb,
  team_count integer default 1,
  rating integer default 8,
  extra_note text default '',
  photos jsonb default '[]'::jsonb,
  created_at bigint not null
);

create table if not exists public.dqr_territories (
  id text primary key,
  code text not null,
  name text not null,
  description text default '',
  duration_minutes integer default 10,
  current_holder_user_id text,
  current_holder_name text,
  highest_score integer default 0,
  won_on text,
  questions jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  attempted_user_ids jsonb not null default '[]'::jsonb
);

create table if not exists public.dqr_system_messages (
  id text primary key,
  user_id text not null,
  sender text not null check (sender in ('system', 'user')),
  text text not null,
  created_at bigint not null,
  read_by_admin boolean default false,
  read_by_user boolean default false
);

-- 4. Enable Row Level Security with Public Anon Policies (Custom PIN Auth Layer)
alter table public.dqr_users enable row level security;
alter table public.dqr_app_store enable row level security;
alter table public.dqr_quizzes enable row level security;
alter table public.dqr_territories enable row level security;
alter table public.dqr_system_messages enable row level security;

drop policy if exists "Allow anon access dqr_users" on public.dqr_users;
create policy "Allow anon access dqr_users" on public.dqr_users for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_app_store" on public.dqr_app_store;
create policy "Allow anon access dqr_app_store" on public.dqr_app_store for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_quizzes" on public.dqr_quizzes;
create policy "Allow anon access dqr_quizzes" on public.dqr_quizzes for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_territories" on public.dqr_territories;
create policy "Allow anon access dqr_territories" on public.dqr_territories for all using (true) with check (true);

drop policy if exists "Allow anon access dqr_system_messages" on public.dqr_system_messages;
create policy "Allow anon access dqr_system_messages" on public.dqr_system_messages for all using (true) with check (true);

-- 5. Storage Bucket for Founder Photos, Gallery, Territory Icons & Report Cards
insert into storage.buckets (id, name, public)
values ('dqr-media', 'dqr-media', true)
on conflict (id) do nothing;

drop policy if exists "Public Read dqr-media" on storage.objects;
create policy "Public Read dqr-media" on storage.objects
  for select using (bucket_id = 'dqr-media');

drop policy if exists "Public Upload dqr-media" on storage.objects;
create policy "Public Upload dqr-media" on storage.objects
  for insert with check (bucket_id = 'dqr-media');

drop policy if exists "Public Update dqr-media" on storage.objects;
create policy "Public Update dqr-media" on storage.objects
  for update using (bucket_id = 'dqr-media');

-- Mocha Madness — Supabase Database Schema
-- Run this in the Supabase SQL editor to set up all tables and RLS policies.

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────
create table if not exists teams (
  id serial primary key,
  name text not null,
  seed integer,
  region text  -- 'South' | 'East' | 'West' | 'Midwest'
);

-- ─────────────────────────────────────────
-- GAMES
-- ─────────────────────────────────────────
create table if not exists games (
  id serial primary key,
  round integer not null,       -- 1=R64, 2=R32, 3=S16, 4=E8, 5=FF, 6=Champ
  region text,                  -- null for Final Four / Championship
  game_order integer,           -- position within the round/region
  team1_id integer references teams(id),
  team2_id integer references teams(id),
  winner_id integer references teams(id),
  next_game_id integer references games(id),
  next_slot integer,            -- 1 or 2 (which slot in next game the winner fills)
  tiebreaker_score integer      -- actual championship total score (for tiebreaker)
);

-- ─────────────────────────────────────────
-- BRACKETS
-- ─────────────────────────────────────────
create table if not exists brackets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text default 'My Bracket',
  status text default 'draft',           -- draft | submitted | locked
  payment_status text default 'pending', -- pending | overdue | complete (admin-managed)
  tiebreaker integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- BRACKET PICKS
-- ─────────────────────────────────────────
create table if not exists bracket_picks (
  id serial primary key,
  bracket_id uuid references brackets(id) on delete cascade,
  game_id integer references games(id),
  picked_winner_id integer references teams(id),
  unique (bracket_id, game_id)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Profiles: users can read/update their own
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Teams: public read
alter table teams enable row level security;
create policy "Public read teams" on teams for select using (true);

-- Games: public read; admins can update results
alter table games enable row level security;
create policy "Public read games" on games for select using (true);
create policy "Admin update games" on games for update using (is_admin());

-- Auto-propagate game winner into the next round's team slot
-- Fires whenever admin sets winner_id on a game
create or replace function propagate_winner()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.winner_id is not null and new.next_game_id is not null then
    if new.next_slot = 1 then
      update games set team1_id = new.winner_id where id = new.next_game_id;
    elsif new.next_slot = 2 then
      update games set team2_id = new.winner_id where id = new.next_game_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_game_winner_set on games;
create trigger on_game_winner_set
  after update of winner_id on games
  for each row execute function propagate_winner();

-- Brackets: users manage their own; admins manage all (for payment status updates etc.)
-- submitted/locked brackets are publicly readable for the leaderboard
alter table brackets enable row level security;
create policy "Users manage own brackets" on brackets for all using (auth.uid() = user_id OR is_admin());
create policy "Public read submitted brackets" on brackets for select using (status in ('submitted', 'locked'));

-- Bracket picks: users manage their own; submitted brackets picks visible to all
alter table bracket_picks enable row level security;
create policy "Users manage own picks" on bracket_picks for all
  using (
    exists (
      select 1 from brackets b
      where b.id = bracket_picks.bracket_id
        and b.user_id = auth.uid()
    )
  );
create policy "Public read submitted picks" on bracket_picks for select
  using (
    exists (
      select 1 from brackets b
      where b.id = bracket_picks.bracket_id
        and b.status in ('submitted', 'locked')
    )
  );

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid references auth.users not null primary key,
  kakao_id text unique,
  nickname text unique not null,
  real_name text not null,
  phone text,
  manner_score float default 0 check (manner_score >= 0),
  best_dresser_score float default 0,
  job text,
  mbti text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Constraint: Nickname cannot be changed (handled via Application Logic mostly, but trigger can enforce updates if strictly needed. 
  -- For now, we rely on RLS or app logic, but let's add a trigger to be "strict" as requested).
  constraint nickname_length check (char_length(nickname) >= 2)
);

-- Trigger to prevent nickname updates
create or replace function prevent_nickname_update()
returns trigger as $$
begin
  if new.nickname <> old.nickname then
    raise exception 'Nickname cannot be changed';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_nickname_update
before update on public.users
for each row execute procedure prevent_nickname_update();


-- RELATIONSHIPS TABLE (1-chon)
create table public.relationships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  friend_id uuid references public.users(id) not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamptz default now(),
  
  -- Prevent self-friending
  constraint no_self_friend check (user_id <> friend_id),
  -- Unique pair (order independent uniqueness is hard in simple constraint, so we make (user_id, friend_id) unique 
  -- and assume app sorts them or we store two rows. Storing two rows (A->B, B->A) for 'accepted' is easier for querying).
  unique(user_id, friend_id)
);


-- BLOCKS TABLE
create table public.blocks (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.users(id) not null,
  blocked_id uuid references public.users(id) not null,
  reason text,
  created_at timestamptz default now(),
  
  unique(blocker_id, blocked_id)
);
-- Note: Logic to auto-block on manner_score 0 should be a trigger on users table.

-- Trigger for Auto-Block is complex (who blocks whom?). 
-- Requirement: "Blocks: Auto block when manner score is 0". 
-- Interpretation: If a user's score drops to 0, they are "blocked" from the system? Or others block them?
-- "차단된 사용자가 포함된 방은 검색에서 제외" implies system-wide restriction or specific user blocks.
-- If manner_score is 0, let's add a status column to users or use a system_blocks table.
-- Let's stick to the prompt's "Blocks list" potentially being user-to-user, 
-- but maybe there's a "System Block" concept.
-- For now, we'll keep the user-to-user block table. 
-- Auto-blocking might mean "If I rate you 0, I block you" OR "System bans user".
-- Given "Manner score 0 -> Auto block", likely means System Ban.
-- Let's add `is_banned` to users.
alter table public.users add column is_banned boolean default false;

create or replace function check_manner_score()
returns trigger as $$
begin
  if new.manner_score = 0 then
    new.is_banned = true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_ban_on_zero_score
before update on public.users
for each row execute procedure check_manner_score();


-- SPONSORS TABLE
create table public.sponsors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  contact_info text,
  logo_url text,
  created_at timestamptz default now()
);

-- ROUNDS / ROOMS TABLE
-- Supports multi-day events (1 night 2 days = multi-round?) 
-- Prompt: "Rounds & Rooms: 1 night 2 days etc support. 4 people per group."
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  host_id uuid references public.users(id) not null,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null, -- checks duration
  location text not null,
  max_participants int default 4, -- Default 4, but maybe total event size is larger?
  -- Prompt says "Each room is 4 people 1 group". 
  -- Maybe Event = Large gathering, Room = Grouping? or Event = Room?
  -- Let's assume Room structure.
  payment_deadline_hours int default 3,
  created_at timestamptz default now()
);

create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.users(id) not null,
  status text check (status in ('joined', 'paid', 'waiting')) default 'joined',
  joined_at timestamptz default now(),
  
  unique(event_id, user_id)
);

-- Morning — Phase 1 schema.
-- Auth: enable Anonymous sign-ins in the Supabase dashboard (Authentication →
-- Providers → Anonymous) so users can start with no signup. Every row is scoped
-- to auth.uid() via RLS.

-- One preferences row per user.
create table if not exists public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_minutes int not null default 10,
  intensity text not null default 'balanced'
    check (intensity in ('gentle', 'balanced', 'energizing')),
  movement_style text not null default 'either'
    check (movement_style in ('yoga', 'taichi', 'either')),
  updated_at timestamptz not null default now()
);

-- Mood check-ins (the mental-health signal + retention input).
create table if not exists public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood text not null,
  phase text not null check (phase in ('pre', 'post')),
  note text,
  journey_id text,
  created_at timestamptz not null default now()
);

-- Completed journeys (validation funnel: started vs completed).
create table if not exists public.journey_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journey_id text not null,
  total_sec int not null,
  created_at timestamptz not null default now()
);

create index if not exists mood_checkins_user_created_idx
  on public.mood_checkins (user_id, created_at desc);
create index if not exists journey_completions_user_created_idx
  on public.journey_completions (user_id, created_at desc);

alter table public.preferences enable row level security;
alter table public.mood_checkins enable row level security;
alter table public.journey_completions enable row level security;

-- Each user may only read/write their own rows.
create policy "own preferences" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own checkins" on public.mood_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own completions" on public.journey_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

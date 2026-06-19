-- ──────────────────────────────────────────────────────────────────────────
-- Summer Pact — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- It creates tables, a helper to check pact membership, and RLS policies so
-- users can only read/write data inside pacts they belong to.
-- ──────────────────────────────────────────────────────────────────────────

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ───────────────────────────── Tables ─────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Friend',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.pacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  start_date date not null default current_date,
  end_date date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pact_members (
  id uuid primary key default gen_random_uuid(),
  pact_id uuid not null references public.pacts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (pact_id, user_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pact_id uuid not null references public.pacts (id) on delete cascade,
  title text not null,
  category text not null default 'Other',
  why_it_matters text,
  minimum_success text,
  dream_success text,
  weekly_target integer not null default 4,
  xp_target integer not null default 300,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pact_id uuid not null references public.pacts (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  check_in_date date not null default current_date,
  reflection text,
  proof_url text,
  effort_level integer not null check (effort_level between 1 and 5),
  mood text,
  blocker text,
  tomorrow_step text,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pact_id uuid not null references public.pacts (id) on delete cascade,
  week_start date not null,
  summary text,
  boss_fight text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  pact_id uuid not null references public.pacts (id) on delete cascade,
  message text not null,
  copied boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_members_pact on public.pact_members (pact_id);
create index if not exists idx_members_user on public.pact_members (user_id);
create index if not exists idx_goals_pact on public.goals (pact_id);
create index if not exists idx_checkins_pact on public.check_ins (pact_id);
create index if not exists idx_checkins_user_date on public.check_ins (user_id, check_in_date);

-- ─────────────────────── Membership helper ────────────────────────────────
-- SECURITY DEFINER avoids recursive RLS when checking membership.
create or replace function public.is_pact_member(p_pact_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pact_members m
    where m.pact_id = p_pact_id
      and m.user_id = auth.uid()
  );
$$;

-- ──────────────────────────── RLS ─────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.pacts          enable row level security;
alter table public.pact_members   enable row level security;
alter table public.goals          enable row level security;
alter table public.check_ins      enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.nudges         enable row level security;

-- profiles: a user manages their own; can read profiles of pact-mates.
drop policy if exists "profiles_select_own_or_pactmate" on public.profiles;
create policy "profiles_select_own_or_pactmate" on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.pact_members me
      join public.pact_members them on them.pact_id = me.pact_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- pacts: members can read; anyone authenticated can create; creator updates.
-- (SELECT also allows reading a pact by invite code to join — see app logic.)
drop policy if exists "pacts_select_member" on public.pacts;
create policy "pacts_select_member" on public.pacts
  for select using (public.is_pact_member(id) or created_by = auth.uid());

drop policy if exists "pacts_insert_self" on public.pacts;
create policy "pacts_insert_self" on public.pacts
  for insert with check (created_by = auth.uid());

drop policy if exists "pacts_update_creator" on public.pacts;
create policy "pacts_update_creator" on public.pacts
  for update using (created_by = auth.uid());

-- pact_members: members can read the roster; users can add themselves.
drop policy if exists "members_select" on public.pact_members;
create policy "members_select" on public.pact_members
  for select using (public.is_pact_member(pact_id) or user_id = auth.uid());

drop policy if exists "members_insert_self" on public.pact_members;
create policy "members_insert_self" on public.pact_members
  for insert with check (user_id = auth.uid());

drop policy if exists "members_delete_self" on public.pact_members;
create policy "members_delete_self" on public.pact_members
  for delete using (user_id = auth.uid());

-- goals / check_ins / weekly_reviews: readable by any pact member; writable
-- only by the owning user (and must belong to a pact they're in).
do $$
declare t text;
begin
  foreach t in array array['goals','check_ins','weekly_reviews']
  loop
    execute format('drop policy if exists "%s_select_member" on public.%I;', t, t);
    execute format(
      'create policy "%s_select_member" on public.%I for select using (public.is_pact_member(pact_id));',
      t, t
    );
    execute format('drop policy if exists "%s_write_own" on public.%I;', t, t);
    execute format(
      'create policy "%s_write_own" on public.%I for all using (user_id = auth.uid() and public.is_pact_member(pact_id)) with check (user_id = auth.uid() and public.is_pact_member(pact_id));',
      t, t
    );
  end loop;
end $$;

-- nudges: pact members can read; sender can create/update their own.
drop policy if exists "nudges_select_member" on public.nudges;
create policy "nudges_select_member" on public.nudges
  for select using (public.is_pact_member(pact_id));

drop policy if exists "nudges_insert_sender" on public.nudges;
create policy "nudges_insert_sender" on public.nudges
  for insert with check (from_user_id = auth.uid() and public.is_pact_member(pact_id));

drop policy if exists "nudges_update_sender" on public.nudges;
create policy "nudges_update_sender" on public.nudges
  for update using (from_user_id = auth.uid());

-- ───────────────────────── Join a pact by code ────────────────────────────
-- RLS hides pacts you're not in, so joining needs a SECURITY DEFINER function
-- that can look up the pact by code, enforce the 2-member cap, and add you.
create or replace function public.join_pact(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pact_id uuid;
  v_count int;
begin
  select id into v_pact_id
  from public.pacts
  where invite_code = upper(trim(p_code));

  if v_pact_id is null then
    raise exception 'No pact found with that code';
  end if;

  -- Already a member? Idempotent success.
  if exists (
    select 1 from public.pact_members
    where pact_id = v_pact_id and user_id = auth.uid()
  ) then
    return v_pact_id;
  end if;

  select count(*) into v_count
  from public.pact_members
  where pact_id = v_pact_id;

  if v_count >= 2 then
    raise exception 'This pact is full (2 members max)';
  end if;

  insert into public.pact_members (pact_id, user_id, role)
  values (v_pact_id, auth.uid(), 'member');

  return v_pact_id;
end;
$$;

grant execute on function public.join_pact(text) to authenticated;

-- ──────────────────── Auto-create profile on signup ───────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────── Storage (proofs) ────────────────────────────────
-- Create a bucket named 'proofs' (public) in the Storage UI, or:
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to the proofs bucket.
drop policy if exists "proofs_authenticated_upload" on storage.objects;
create policy "proofs_authenticated_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs');

drop policy if exists "proofs_public_read" on storage.objects;
create policy "proofs_public_read" on storage.objects
  for select using (bucket_id = 'proofs');

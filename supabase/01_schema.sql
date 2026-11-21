-- Northeast Connect — database schema
-- Run in Supabase: SQL Editor → New query → paste this whole file → Run.
-- Safe to run again (it only creates what is missing and resets policies).
--
-- Security model
--   * Everyone (anon key, no login) can READ every table.
--   * Only a logged-in user listed in public.admins can INSERT/UPDATE/DELETE.
--     Logging in alone is NOT enough, so a stray sign-up can't edit data.
--   * Rows with is_demo = true are demo data and must be labelled on screen.

-- ─────────────────────────────────────────────────────────────── admins ──
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- True when the current request comes from a logged-in admin.
-- security definer: reads public.admins without going through its RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Keeps updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────── disasters ──
create table if not exists public.disasters (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('flood', 'landslide', 'earthquake', 'other')),
  severity    text not null check (severity in ('low', 'moderate', 'high', 'severe')),
  title       text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 2000),
  district    text,
  state       text,
  -- Centre point, kept inside the North East India box.
  lat         double precision not null check (lat between 21.5 and 29.8),
  lng         double precision not null check (lng between 87.5 and 97.8),
  radius_km   numeric(6, 2) not null check (radius_km > 0 and radius_km <= 300),
  active      boolean not null default true,
  is_demo     boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists disasters_active_idx on public.disasters (active);

-- ─────────────────────────────────────────────────────────── risk_zones ──
create table if not exists public.risk_zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  type        text not null check (type in ('flood', 'landslide')),
  level       text not null default 'moderate' check (level in ('moderate', 'high')),
  district    text,
  state       text,
  -- GeoJSON geometry (lng/lat order), Polygon or MultiPolygon.
  geometry    jsonb not null check (geometry ->> 'type' in ('Polygon', 'MultiPolygon')),
  description text check (char_length(description) <= 2000),
  is_demo     boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────── contacts ──
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  -- Digits, spaces, +, - only so it always works as a tel: link.
  phone       text not null check (phone ~ '^\+?[0-9][0-9 -]{1,19}$'),
  category    text not null check (
                category in ('emergency', 'police', 'ambulance', 'fire', 'control_room', 'hospital')
              ),
  district    text,           -- null = works everywhere
  state       text,           -- null = all NE states
  is_demo     boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────── shelters ──
create table if not exists public.shelters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  type        text not null check (type in ('relief_camp', 'hospital', 'shelter')),
  lat         double precision not null check (lat between 21.5 and 29.8),
  lng         double precision not null check (lng between 87.5 and 97.8),
  capacity    integer check (capacity >= 0),
  district    text,
  state       text,
  phone       text check (phone ~ '^\+?[0-9][0-9 -]{1,19}$'),
  is_demo     boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────── ngos ──
create table if not exists public.ngos (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  phone       text check (phone ~ '^\+?[0-9][0-9 -]{1,19}$'),
  focus       text check (char_length(focus) <= 200),   -- e.g. "rescue, food"
  lat         double precision check (lat between 21.5 and 29.8),
  lng         double precision check (lng between 87.5 and 97.8),
  disaster_id uuid references public.disasters (id) on delete set null,
  active      boolean not null default true,
  is_demo     boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ngos_disaster_idx on public.ngos (disaster_id);

-- ─────────────────────────────────────────── triggers, RLS, grants, realtime ──
do $$
declare
  t text;
begin
  foreach t in array array['disasters', 'risk_zones', 'contacts', 'shelters', 'ngos'] loop
    -- updated_at trigger
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);

    -- Row Level Security
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Public can read" on public.%I', t);
    execute format(
      'create policy "Public can read" on public.%I
         for select to anon, authenticated using (true)', t);

    execute format('drop policy if exists "Admins can insert" on public.%I', t);
    execute format(
      'create policy "Admins can insert" on public.%I
         for insert to authenticated with check ((select public.is_admin()))', t);

    execute format('drop policy if exists "Admins can update" on public.%I', t);
    execute format(
      'create policy "Admins can update" on public.%I
         for update to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))', t);

    execute format('drop policy if exists "Admins can delete" on public.%I', t);
    execute format(
      'create policy "Admins can delete" on public.%I
         for delete to authenticated using ((select public.is_admin()))', t);

    -- Table privileges (RLS above still decides which rows).
    -- TRUNCATE ignores RLS, so nobody outside the SQL Editor gets it.
    execute format('revoke truncate on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);

    -- Realtime: the public map updates live when an admin saves.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

-- admins: a logged-in user may only see whether THEY are an admin.
-- Nobody can write this table directly. The first admin is added in the SQL
-- Editor (supabase/03_make_admin.sql); after that, admins use the "Manage
-- admins" page, which calls the checked functions in 04_admin_tools.sql.
alter table public.admins enable row level security;
drop policy if exists "Users can see their own admin row" on public.admins;
create policy "Users can see their own admin row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- Northeast Connect — spread speed + "Simulate disaster" (feature 6)
-- Run AFTER 01–04: SQL Editor → New query → paste this whole file → Run.
-- Safe to run again.
--
-- How a simulation works
--   * start_simulation(id) saves the server time in sim_started_at.
--   * While it runs, every phone works out the radius itself:
--       radius = radius_km + spread_kmh × simulated hours
--     with SIM_FACTOR = 60 (1 real second = 1 simulated minute).
--     The same number is in src/lib/simulation.ts — keep them equal.
--   * stop_simulation(id) saves the grown radius and clears sim_started_at.
--   * Nothing is written while it runs, so phones stay in sync through
--     realtime without a stream of updates.

alter table public.disasters
  add column if not exists spread_kmh numeric(6, 2) not null default 3
    check (spread_kmh >= 0 and spread_kmh <= 200),
  add column if not exists sim_started_at timestamptz;

-- ─────────────────────────────────────────────────────── start_simulation ──
create or replace function public.start_simulation(p_id uuid)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only admins can run a simulation.' using errcode = 'P0001';
  end if;

  update public.disasters
     set sim_started_at = now(),
         active = true          -- a hidden disaster can't be simulated
   where id = p_id and sim_started_at is null;

  return case when found then 'started' else 'already' end;
end;
$$;

-- ──────────────────────────────────────────────────────── stop_simulation ──
create or replace function public.stop_simulation(p_id uuid)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only admins can stop a simulation.' using errcode = 'P0001';
  end if;

  update public.disasters
     set radius_km = least(
           300,
           round(radius_km + spread_kmh * 60 * extract(epoch from (now() - sim_started_at)) / 3600, 2)
         ),
         sim_started_at = null
   where id = p_id and sim_started_at is not null;

  return case when found then 'stopped' else 'not_running' end;
end;
$$;

revoke all on function public.start_simulation(uuid) from public, anon;
revoke all on function public.stop_simulation(uuid) from public, anon;
grant execute on function public.start_simulation(uuid) to authenticated;
grant execute on function public.stop_simulation(uuid) to authenticated;

-- Northeast Connect — local-sounding names for the seed help groups and
-- shelters, and "Reset demo" support for shelters made by the demo buttons.
-- Run AFTER 06_demo_reset.sql: SQL Editor → New query → paste → Run.
-- Safe to run more than once (renames only rows that still have the old name).
--
-- All names are made up. Rows stay marked is_demo = true, so the app keeps
-- showing "Demo data" on them. No real organisation names are used.

begin;

-- ─────────────────────────────────────────── help groups (ngos table) ──
update public.ngos as n
   set name = v.new_name, focus = v.focus
  from (values
    ('Demo Volunteer Rescue Group',   'Brahmaputra Boat Rescue',  'rescue boats, life jackets'),
    ('Demo Community Kitchen',        'Majuli Relief Volunteers', 'relief kits, temporary shelter'),
    ('Demo Medical Aid Team',         'Kamrup Food Bank',         'food packets, drinking water'),
    ('Demo Road Clearing Volunteers', 'Hills First Aid Team',     'first aid, clearing roads')
  ) as v(old_name, new_name, focus)
 where n.name = v.old_name and n.is_demo;

-- ─────────────────────────────────────────────────────────── shelters ──
update public.shelters as s
   set name = v.new_name
  from (values
    ('Demo Relief Camp – Dhemaji town', 'Namghar Relief Camp, Dhemaji'),
    ('Demo Relief Camp – Silapathar',   'District Sports Complex Camp, Silapathar'),
    ('Demo Relief Camp – Morigaon',     'Govt. HS School Camp, Morigaon'),
    ('Demo Shelter – Haflong',          'Panchayat Bhawan Shelter, Haflong'),
    ('Demo Shelter – Aizawl',           'Community Hall Shelter, Aizawl'),
    ('Demo Hospital – Guwahati',        'Riverside Health Centre, Guwahati'),
    ('Demo Hospital – Shillong',        'Pinewood Health Centre, Shillong'),
    ('Demo Hospital – Imphal',          'Lotus Lake Health Centre, Imphal'),
    ('Demo Hospital – Gangtok',         'Hillside Health Centre, Gangtok')
  ) as v(old_name, new_name)
 where s.name = v.old_name and s.is_demo;

-- ───────────────────────────── shelters made by the demo buttons ──
alter table public.shelters
  add column if not exists created_by_demo boolean not null default false;

-- reset_demo() also deletes demo-button shelters (same as in 06_demo_reset.sql).
create or replace function public.reset_demo()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  n_sims int;
  n_radius int;
  n_ngos int;
  n_shelters int;
  n_disasters int;
begin
  if not (select public.is_admin()) then
    raise exception 'Only admins can reset the demo.' using errcode = 'P0001';
  end if;

  select count(*) into n_sims from public.disasters where sim_started_at is not null;

  -- Stop simulations and put every simulated disaster back to its original size.
  update public.disasters
     set radius_km = coalesce(sim_base_radius_km, radius_km),
         sim_started_at = null,
         sim_base_radius_km = null
   where sim_started_at is not null or sim_base_radius_km is not null;
  get diagnostics n_radius = row_count;

  -- Delete only what the demo buttons created (help groups first: they point at disasters).
  delete from public.ngos where created_by_demo;
  get diagnostics n_ngos = row_count;
  delete from public.shelters where created_by_demo;
  get diagnostics n_shelters = row_count;
  delete from public.disasters where created_by_demo;
  get diagnostics n_disasters = row_count;

  return jsonb_build_object(
    'simulations_stopped', n_sims,
    'radii_restored', n_radius,
    'ngos_deleted', n_ngos,
    'shelters_deleted', n_shelters,
    'disasters_deleted', n_disasters
  );
end;
$$;

revoke all on function public.reset_demo() from public, anon;
grant execute on function public.reset_demo() to authenticated;

commit;

-- Check: the new names (4 help groups, 9 shelters).
select 'help group' as kind, name from public.ngos
 where name in ('Brahmaputra Boat Rescue', 'Majuli Relief Volunteers', 'Kamrup Food Bank', 'Hills First Aid Team')
union all
select 'shelter', name from public.shelters
 where name in ('Namghar Relief Camp, Dhemaji', 'District Sports Complex Camp, Silapathar', 'Govt. HS School Camp, Morigaon',
                'Panchayat Bhawan Shelter, Haflong', 'Community Hall Shelter, Aizawl', 'Riverside Health Centre, Guwahati',
                'Pinewood Health Centre, Shillong', 'Lotus Lake Health Centre, Imphal', 'Hillside Health Centre, Gangtok')
order by kind, name;

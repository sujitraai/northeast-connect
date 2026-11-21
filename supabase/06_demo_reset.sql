-- Northeast Connect — safe "Reset demo" + restore the starting seed data
-- Run AFTER 01–05: SQL Editor → New query → paste this whole file → Run.
-- Safe to run again: it never creates duplicates.
--
-- What it does
--   1. Adds created_by_demo to disasters and ngos. Only rows made by the
--      admin's demo buttons ("Flood / Landslide near demo location",
--      "Add NGO") get it. "Reset demo" deletes ONLY those rows.
--   2. Adds sim_base_radius_km: the radius before the first Simulate, so
--      Reset can put a simulated disaster back to its original size.
--   3. reset_demo(): stops every simulation, restores original radii,
--      deletes demo-button rows. Seed data and hand-added rows stay.
--   4. Puts back any seed row that is missing (matched by title / name /
--      number), so the starting data is complete again.

begin;

-- ───────────────────────────────────────────────────────────── 1 + 2 ──
alter table public.disasters
  add column if not exists created_by_demo boolean not null default false,
  add column if not exists sim_base_radius_km numeric(6, 2);
alter table public.ngos
  add column if not exists created_by_demo boolean not null default false;

-- Simulate now remembers the radius it started from (only the first time,
-- so Start → Stop → Start keeps the true original).
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
     set sim_base_radius_km = coalesce(sim_base_radius_km, radius_km),
         sim_started_at = now(),
         active = true
   where id = p_id and sim_started_at is null;

  return case when found then 'started' else 'already' end;
end;
$$;

-- ──────────────────────────────────────────────────────────────── 3 ──
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

  -- Delete only what the demo buttons created (NGOs first: they point at disasters).
  delete from public.ngos where created_by_demo;
  get diagnostics n_ngos = row_count;
  delete from public.disasters where created_by_demo;
  get diagnostics n_disasters = row_count;

  return jsonb_build_object(
    'simulations_stopped', n_sims,
    'radii_restored', n_radius,
    'ngos_deleted', n_ngos,
    'disasters_deleted', n_disasters
  );
end;
$$;

revoke all on function public.reset_demo() from public, anon;
grant execute on function public.reset_demo() to authenticated;

-- ──────────────────────────────────────────────── 4. restore the seed ──
-- Same rows as 02_seed.sql, added only where missing.

insert into public.contacts (name, phone, category, district, state, is_demo, source)
select v.name, v.phone, v.category, null, null, false, 'National helpline (India)'
from (values
  ('Emergency (all services)',       '112',  'emergency'),
  ('Police',                         '100',  'police'),
  ('Ambulance',                      '108',  'ambulance'),
  ('Fire',                           '101',  'fire'),
  ('State disaster control room',    '1070', 'control_room'),
  ('District disaster control room', '1077', 'control_room')
) as v(name, phone, category)
where not exists (
  select 1 from public.contacts c where c.phone = v.phone and c.source = 'National helpline (India)'
);

insert into public.disasters
  (type, severity, title, description, district, state, lat, lng, radius_km, active, is_demo, source)
select v.type, v.severity, v.title, v.description, v.district, v.state, v.lat, v.lng, v.radius_km, v.active, true, 'Demo data'
from (values
  ('flood', 'severe', 'Brahmaputra flood – Dhemaji',
   'Demo: river water rising, low-lying villages flooded.',
   'Dhemaji', 'Assam', 27.48::float8, 94.58::float8, 25::numeric, true),
  ('flood', 'high', 'Flood – Morigaon',
   'Demo: embankment breach reported, roads under water.',
   'Marigaon', 'Assam', 26.25, 92.34, 15, true),
  ('landslide', 'high', 'Landslide – Haflong',
   'Demo: road blocked by landslide after heavy rain.',
   'Dima Hasao', 'Assam', 25.17, 93.02, 5, true),
  ('landslide', 'moderate', 'Landslide risk – Aizawl',
   'Demo: cracks seen on hill slopes, stay alert.',
   'Aizawl', 'Mizoram', 23.73, 92.72, 4, true),
  ('earthquake', 'moderate', 'Earthquake – Imphal (past)',
   'Demo: past event, no longer active.',
   'Imphal East', 'Manipur', 24.81, 93.94, 40, false)
) as v(type, severity, title, description, district, state, lat, lng, radius_km, active)
where not exists (select 1 from public.disasters d where d.title = v.title);

insert into public.risk_zones (name, type, level, district, state, geometry, description, is_demo, source)
select v.name, v.type, v.level, v.district, v.state, v.geometry::jsonb, v.description, true, 'Demo data'
from (values
  ('Brahmaputra flood plain – Dhemaji/Lakhimpur', 'flood', 'high', 'Dhemaji', 'Assam',
   '{"type":"Polygon","coordinates":[[[94.00,27.18],[94.40,27.30],[94.95,27.50],[95.05,27.40],[94.45,27.18],[94.05,27.06],[94.00,27.18]]]}',
   'Demo outline of a flood-prone area.'),
  ('Kopili/Brahmaputra flood plain – Morigaon', 'flood', 'high', 'Marigaon', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.05,26.18],[92.35,26.33],[92.65,26.38],[92.70,26.26],[92.40,26.18],[92.10,26.06],[92.05,26.18]]]}',
   'Demo outline of a flood-prone area.'),
  ('Barak valley low land – Silchar', 'flood', 'moderate', 'Cachar', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.65,24.78],[92.92,24.86],[92.98,24.78],[92.75,24.70],[92.65,24.78]]]}',
   'Demo outline of a flood-prone area.'),
  ('Haflong hills', 'landslide', 'high', 'Dima Hasao', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.92,25.08],[93.12,25.08],[93.12,25.28],[92.92,25.28],[92.92,25.08]]]}',
   'Demo outline of a landslide-prone area.'),
  ('Aizawl slopes', 'landslide', 'high', 'Aizawl', 'Mizoram',
   '{"type":"Polygon","coordinates":[[[92.67,23.66],[92.78,23.66],[92.78,23.80],[92.67,23.80],[92.67,23.66]]]}',
   'Demo outline of a landslide-prone area.'),
  ('Guwahati hills', 'landslide', 'moderate', 'Kamrup Metropolitan', 'Assam',
   '{"type":"Polygon","coordinates":[[[91.72,26.09],[91.84,26.09],[91.84,26.16],[91.72,26.16],[91.72,26.09]]]}',
   'Demo outline of a landslide-prone area.'),
  ('North Sikkim valleys – Mangan', 'landslide', 'high', 'North', 'Sikkim',
   '{"type":"Polygon","coordinates":[[[88.47,27.47],[88.62,27.47],[88.62,27.62],[88.47,27.62],[88.47,27.47]]]}',
   'Demo outline of a landslide-prone area.')
) as v(name, type, level, district, state, geometry, description)
where not exists (select 1 from public.risk_zones z where z.name = v.name);

insert into public.shelters (name, type, lat, lng, capacity, district, state, is_demo, source)
select v.name, v.type, v.lat, v.lng, v.capacity, v.district, v.state, true, 'Demo data'
from (values
  ('Demo Relief Camp – Dhemaji town', 'relief_camp', 27.475::float8, 94.555::float8, 400, 'Dhemaji',             'Assam'),
  ('Demo Relief Camp – Silapathar',   'relief_camp', 27.595, 94.725, 250, 'Dhemaji',             'Assam'),
  ('Demo Relief Camp – Morigaon',     'relief_camp', 26.250, 92.345, 300, 'Marigaon',            'Assam'),
  ('Demo Shelter – Haflong',          'shelter',     25.170, 93.015, 120, 'Dima Hasao',          'Assam'),
  ('Demo Shelter – Aizawl',           'shelter',     23.735, 92.715, 150, 'Aizawl',              'Mizoram'),
  ('Demo Hospital – Guwahati',        'hospital',    26.155, 91.765, 500, 'Kamrup Metropolitan', 'Assam'),
  ('Demo Hospital – Shillong',        'hospital',    25.575, 91.890, 300, 'East Khasi Hills',    'Meghalaya'),
  ('Demo Hospital – Imphal',          'hospital',    24.815, 93.930, 300, 'Imphal East',         'Manipur'),
  ('Demo Hospital – Gangtok',         'hospital',    27.330, 88.612, 200, 'East',                'Sikkim')
) as v(name, type, lat, lng, capacity, district, state)
where not exists (select 1 from public.shelters s where s.name = v.name);

insert into public.ngos (name, phone, focus, lat, lng, disaster_id, active, is_demo, source)
select v.name, null, v.focus, v.lat, v.lng, d.id, true, true, 'Demo data'
from (values
  ('Demo Volunteer Rescue Group',   'rescue, boats',             27.470::float8, 94.600::float8, 'Brahmaputra flood – Dhemaji'),
  ('Demo Community Kitchen',        'food, drinking water',      27.480, 94.560, 'Brahmaputra flood – Dhemaji'),
  ('Demo Medical Aid Team',         'first aid, medicine',       26.255, 92.350, 'Flood – Morigaon'),
  ('Demo Road Clearing Volunteers', 'clearing roads, transport', 25.165, 93.025, 'Landslide – Haflong')
) as v(name, focus, lat, lng, disaster_title)
join lateral (
  select id from public.disasters where title = v.disaster_title order by created_at limit 1
) d on true
where not exists (select 1 from public.ngos n where n.name = v.name);

commit;

-- Check: the seed rows should all be back (5 / 7 / 6 / 9 / 4).
select 'seed disasters' as what, count(*) from public.disasters
  where title in ('Brahmaputra flood – Dhemaji', 'Flood – Morigaon', 'Landslide – Haflong',
                  'Landslide risk – Aizawl', 'Earthquake – Imphal (past)')
union all select 'seed risk zones', count(*) from public.risk_zones where is_demo and source = 'Demo data'
union all select 'national contacts', count(*) from public.contacts where source = 'National helpline (India)'
union all select 'seed shelters', count(*) from public.shelters where name like 'Demo %'
union all select 'seed NGOs', count(*) from public.ngos
  where name in ('Demo Volunteer Rescue Group', 'Demo Community Kitchen', 'Demo Medical Aid Team', 'Demo Road Clearing Volunteers');

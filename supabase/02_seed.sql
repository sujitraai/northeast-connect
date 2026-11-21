-- Northeast Connect — seed data
-- Run AFTER 01_schema.sql: SQL Editor → New query → paste → Run.
-- For a FIRST setup only. Running it again deletes every row marked Demo data
-- (including demo rows added by hand). To put missing seed rows back without
-- deleting anything, run 06_demo_reset.sql instead.
--
-- HONESTY RULES
--   * Everything marked is_demo = true is invented for the demo. The app must
--     label it "Demo data". Places are real districts, events are not.
--   * Demo rows have NO phone numbers, so nobody can tap-to-call a random
--     stranger's number.
--   * The only real numbers here are India's national emergency short codes
--     (is_demo = false).

begin;

delete from public.ngos       where is_demo;
delete from public.disasters  where is_demo;
delete from public.risk_zones where is_demo;
delete from public.shelters   where is_demo;
delete from public.contacts   where is_demo or source = 'National helpline (India)';

-- ─────────────────────────────────────────── contacts (REAL national codes) ──
insert into public.contacts (name, phone, category, district, state, is_demo, source) values
  ('Emergency (all services)',        '112',  'emergency',    null, null, false, 'National helpline (India)'),
  ('Police',                          '100',  'police',       null, null, false, 'National helpline (India)'),
  ('Ambulance',                       '108',  'ambulance',    null, null, false, 'National helpline (India)'),
  ('Fire',                            '101',  'fire',         null, null, false, 'National helpline (India)'),
  ('State disaster control room',     '1070', 'control_room', null, null, false, 'National helpline (India)'),
  ('District disaster control room',  '1077', 'control_room', null, null, false, 'National helpline (India)');

-- ─────────────────────────────────────────────────────── disasters (DEMO) ──
insert into public.disasters
  (type, severity, title, description, district, state, lat, lng, radius_km, active, is_demo, source)
values
  ('flood', 'severe', 'Brahmaputra flood – Dhemaji',
   'Demo: river water rising, low-lying villages flooded.',
   'Dhemaji', 'Assam', 27.48, 94.58, 25, true, true, 'Demo data'),
  ('flood', 'high', 'Flood – Morigaon',
   'Demo: embankment breach reported, roads under water.',
   'Marigaon', 'Assam', 26.25, 92.34, 15, true, true, 'Demo data'),
  ('landslide', 'high', 'Landslide – Haflong',
   'Demo: road blocked by landslide after heavy rain.',
   'Dima Hasao', 'Assam', 25.17, 93.02, 5, true, true, 'Demo data'),
  ('landslide', 'moderate', 'Landslide risk – Aizawl',
   'Demo: cracks seen on hill slopes, stay alert.',
   'Aizawl', 'Mizoram', 23.73, 92.72, 4, true, true, 'Demo data'),
  ('earthquake', 'moderate', 'Earthquake – Imphal (past)',
   'Demo: past event, no longer active.',
   'Imphal East', 'Manipur', 24.81, 93.94, 40, false, true, 'Demo data');

-- ───────────────────────────────────────────────────── risk_zones (DEMO) ──
-- Rough outlines for the demo, NOT official hazard maps. GeoJSON is [lng, lat].
insert into public.risk_zones (name, type, level, district, state, geometry, description, is_demo, source) values
  ('Brahmaputra flood plain – Dhemaji/Lakhimpur', 'flood', 'high', 'Dhemaji', 'Assam',
   '{"type":"Polygon","coordinates":[[[94.00,27.18],[94.40,27.30],[94.95,27.50],[95.05,27.40],[94.45,27.18],[94.05,27.06],[94.00,27.18]]]}',
   'Demo outline of a flood-prone area.', true, 'Demo data'),
  ('Kopili/Brahmaputra flood plain – Morigaon', 'flood', 'high', 'Marigaon', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.05,26.18],[92.35,26.33],[92.65,26.38],[92.70,26.26],[92.40,26.18],[92.10,26.06],[92.05,26.18]]]}',
   'Demo outline of a flood-prone area.', true, 'Demo data'),
  ('Barak valley low land – Silchar', 'flood', 'moderate', 'Cachar', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.65,24.78],[92.92,24.86],[92.98,24.78],[92.75,24.70],[92.65,24.78]]]}',
   'Demo outline of a flood-prone area.', true, 'Demo data'),
  ('Haflong hills', 'landslide', 'high', 'Dima Hasao', 'Assam',
   '{"type":"Polygon","coordinates":[[[92.92,25.08],[93.12,25.08],[93.12,25.28],[92.92,25.28],[92.92,25.08]]]}',
   'Demo outline of a landslide-prone area.', true, 'Demo data'),
  ('Aizawl slopes', 'landslide', 'high', 'Aizawl', 'Mizoram',
   '{"type":"Polygon","coordinates":[[[92.67,23.66],[92.78,23.66],[92.78,23.80],[92.67,23.80],[92.67,23.66]]]}',
   'Demo outline of a landslide-prone area.', true, 'Demo data'),
  ('Guwahati hills', 'landslide', 'moderate', 'Kamrup Metropolitan', 'Assam',
   '{"type":"Polygon","coordinates":[[[91.72,26.09],[91.84,26.09],[91.84,26.16],[91.72,26.16],[91.72,26.09]]]}',
   'Demo outline of a landslide-prone area.', true, 'Demo data'),
  ('North Sikkim valleys – Mangan', 'landslide', 'high', 'North', 'Sikkim',
   '{"type":"Polygon","coordinates":[[[88.47,27.47],[88.62,27.47],[88.62,27.62],[88.47,27.62],[88.47,27.47]]]}',
   'Demo outline of a landslide-prone area.', true, 'Demo data');

-- ─────────────────────────────────────────────────────── shelters (DEMO) ──
-- Invented names on purpose: we don't pin real buildings without checking them.
insert into public.shelters (name, type, lat, lng, capacity, district, state, is_demo, source) values
  ('Demo Relief Camp – Dhemaji town',   'relief_camp', 27.475, 94.555, 400, 'Dhemaji',             'Assam',     true, 'Demo data'),
  ('Demo Relief Camp – Silapathar',     'relief_camp', 27.595, 94.725, 250, 'Dhemaji',             'Assam',     true, 'Demo data'),
  ('Demo Relief Camp – Morigaon',       'relief_camp', 26.250, 92.345, 300, 'Marigaon',            'Assam',     true, 'Demo data'),
  ('Demo Shelter – Haflong',            'shelter',     25.170, 93.015, 120, 'Dima Hasao',          'Assam',     true, 'Demo data'),
  ('Demo Shelter – Aizawl',             'shelter',     23.735, 92.715, 150, 'Aizawl',              'Mizoram',   true, 'Demo data'),
  ('Demo Hospital – Guwahati',          'hospital',    26.155, 91.765, 500, 'Kamrup Metropolitan', 'Assam',     true, 'Demo data'),
  ('Demo Hospital – Shillong',          'hospital',    25.575, 91.890, 300, 'East Khasi Hills',    'Meghalaya', true, 'Demo data'),
  ('Demo Hospital – Imphal',            'hospital',    24.815, 93.930, 300, 'Imphal East',         'Manipur',   true, 'Demo data'),
  ('Demo Hospital – Gangtok',           'hospital',    27.330, 88.612, 200, 'East',         'Sikkim',    true, 'Demo data');

-- ─────────────────────────────────────────────────────────── ngos (DEMO) ──
insert into public.ngos (name, phone, focus, lat, lng, disaster_id, active, is_demo, source)
select v.name, null, v.focus, v.lat, v.lng, d.id, true, true, 'Demo data'
from (values
  ('Demo Volunteer Rescue Group', 'rescue, boats',      27.470, 94.600, 'Brahmaputra flood – Dhemaji'),
  ('Demo Community Kitchen',      'food, drinking water', 27.480, 94.560, 'Brahmaputra flood – Dhemaji'),
  ('Demo Medical Aid Team',       'first aid, medicine', 26.255, 92.350, 'Flood – Morigaon'),
  ('Demo Road Clearing Volunteers', 'clearing roads, transport', 25.165, 93.025, 'Landslide – Haflong')
) as v(name, focus, lat, lng, disaster_title)
join public.disasters d on d.title = v.disaster_title and d.is_demo;

commit;

-- Quick check: row counts per table.
select 'disasters' as table_name, count(*) from public.disasters
union all select 'risk_zones', count(*) from public.risk_zones
union all select 'contacts',   count(*) from public.contacts
union all select 'shelters',   count(*) from public.shelters
union all select 'ngos',       count(*) from public.ngos;

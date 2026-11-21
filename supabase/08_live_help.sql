-- Northeast Connect — Contacts + Help groups tabs (features 8 and 9)
-- Run AFTER 01–07: SQL Editor → New query → paste this whole file → Run.
-- Written to be run once, but safe to run again (adds nothing twice).
--
-- What it does
--   1. contacts.is_national: "National (all users)" contacts are shown to
--      everyone; other contacts only to people in their district (or state).
--      India's national helplines from the seed are marked national.
--   2. Demo district contacts for Kamrup Metropolitan, East Khasi Hills
--      and Dibrugarh. They dial REAL national short codes, named honestly:
--      1077 reaches the disaster control room of the district you call
--      from, and 100 reaches the district police control room. No invented
--      numbers, so nobody can ring a stranger by mistake.
--   3. Demo shelters and help groups in those three districts, so moving
--      the demo location between them visibly changes the lists.
--   4. Seed renames from 07_local_names.sql, in case 07 was not run.
--
-- All demo rows are marked is_demo = true and show "Demo data" in the app.
-- Names are made up; none are real organisations.

begin;

-- ──────────────────────────────────────────────────────────────── 1 ──
alter table public.contacts
  add column if not exists is_national boolean not null default false;

update public.contacts
   set is_national = true, district = null, state = null
 where source = 'National helpline (India)' and not is_national;

-- ──────────────────────────────────────────────────────────────── 2 ──
insert into public.contacts (name, phone, category, district, state, is_national, is_demo, source)
select v.name, v.phone, v.category, v.district, v.state, false, true, 'Demo data (dials a national short code)'
from (values
  ('Kamrup Metropolitan disaster control room', '1077', 'control_room', 'Kamrup Metropolitan', 'Assam'),
  ('Kamrup Metropolitan police control room',   '100',  'police',       'Kamrup Metropolitan', 'Assam'),
  ('East Khasi Hills disaster control room',    '1077', 'control_room', 'East Khasi Hills',    'Meghalaya'),
  ('East Khasi Hills police control room',      '100',  'police',       'East Khasi Hills',    'Meghalaya'),
  ('Dibrugarh disaster control room',           '1077', 'control_room', 'Dibrugarh',           'Assam'),
  ('Dibrugarh police control room',             '100',  'police',       'Dibrugarh',           'Assam')
) as v(name, phone, category, district, state)
where not exists (select 1 from public.contacts c where c.name = v.name);

-- ──────────────────────────────────────────────────────────────── 3 ──
insert into public.shelters (name, type, lat, lng, capacity, district, state, is_demo, source)
select v.name, v.type, v.lat, v.lng, v.capacity, v.district, v.state, true, 'Demo data'
from (values
  ('Satra Prayer Hall Camp, Guwahati',  'relief_camp', 26.160::float8, 91.705::float8, 250, 'Kamrup Metropolitan', 'Assam'),
  ('Govt. LP School Camp, Shillong',    'relief_camp', 25.565, 91.880, 180, 'East Khasi Hills',    'Meghalaya'),
  ('Govt. HS School Camp, Dibrugarh',   'relief_camp', 27.480, 94.900, 300, 'Dibrugarh',           'Assam'),
  ('Riverbank Health Centre, Dibrugarh','hospital',    27.465, 94.925, 250, 'Dibrugarh',           'Assam')
) as v(name, type, lat, lng, capacity, district, state)
where not exists (select 1 from public.shelters s where s.name = v.name);

insert into public.ngos (name, phone, focus, lat, lng, disaster_id, active, is_demo, source)
select v.name, null, v.focus, v.lat, v.lng, null, true, true, 'Demo data'
from (values
  ('Bharalu Relief Volunteers', 'food packets, drinking water',  26.150::float8, 91.750::float8),
  ('Shillong Peak Helpers',     'first aid, digging team',       25.570, 91.890),
  ('Dibru River Volunteers',    'rescue boats, life jackets',    27.470, 94.910)
) as v(name, focus, lat, lng)
where not exists (select 1 from public.ngos n where n.name = v.name);

-- ──────────────────────────────────────────────────────────────── 4 ──
update public.ngos as n
   set name = v.new_name, focus = v.focus
  from (values
    ('Demo Volunteer Rescue Group',   'Brahmaputra Boat Rescue',  'rescue boats, life jackets'),
    ('Demo Community Kitchen',        'Majuli Relief Volunteers', 'relief kits, temporary shelter'),
    ('Demo Medical Aid Team',         'Kamrup Food Bank',         'food packets, drinking water'),
    ('Demo Road Clearing Volunteers', 'Hills First Aid Team',     'first aid, clearing roads')
  ) as v(old_name, new_name, focus)
 where n.name = v.old_name and n.is_demo;

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

commit;

-- Check
select 'national contacts' as what, count(*) from public.contacts where is_national
union all select 'district contacts (3 demo districts)', count(*) from public.contacts
  where district in ('Kamrup Metropolitan', 'East Khasi Hills', 'Dibrugarh')
union all select 'shelters', count(*) from public.shelters
union all select 'active help groups', count(*) from public.ngos where active;

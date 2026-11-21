# Northeast Connect – Community Emergency Assistant

Hackathon project (PromptWars x Code1, PS05). A live, map-based early-warning
platform for North East India (inspired by zoom.earth). Goal: alert people
BEFORE a disaster reaches them, show how safe their area is, and connect
them to help. Two sides: a public app for common people, and an admin panel
to add disasters, alerts, contacts and NGOs.

## Core principles
- The map IS the app: full-screen, satellite-style, mobile-first
- Map covers North East India ONLY (8 states)
- GPS-based: everything is relative to the user's location
- Honest data: anything not from a real live source is labelled
  "Demo data" or "Simulation" on screen

## User-friendly rules (public side)
- Built for common people, not tech users; no login or sign-up
- Big tap targets, plain simple words, icons next to text
- Colours carry meaning: green = Safe, yellow = Watch, red = Danger
- Any phone number is one tap to call
- Large readable text; works on cheap Android phones and slow internet
- Never more than 2 taps to reach help

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- Leaflet + react-leaflet
- Base maps: Esri Light Gray (default) + Esri World Imagery (satellite)
  (no API keys)
- State/district boundaries: DataMeet India GeoJSON (Census 2011)
- Live weather: RainViewer radar tiles (free, no key)
- Turf.js for distance / inside-zone calculations
- Supabase: database, admin login (email + password), realtime updates
- vite-plugin-pwa for offline app shell + cached data
- Deploy: Vercel

## Data (Supabase tables)
- disasters: type (flood/landslide/earthquake/other), severity, centre
  lat/lng, radius, district, description, active, created_at
- risk_zones: flood-prone / landslide-prone areas
- contacts: name, number, district, category (police/ambulance/
  control room/hospital)
- shelters: name, type (relief camp/hospital/shelter), lat/lng, capacity
- ngos: name, phone, focus, lat/lng, linked disaster, active
Public side can only READ. Only a logged-in admin can add/edit/delete.

## Features (build in this order)
1. [DONE] Full-screen map locked to North East India, state + district
   boundaries, outside dimmed, satellite/dark toggle, locate me
2. [DONE] Supabase setup: tables above, security rules (public read, admin
   write), seed with demo data
3. [DONE] Admin panel at /admin: login; add/edit/remove disasters (click a point
   on the map + set radius), contacts, shelters, NGOs; simple forms,
   mobile-friendly
      - "Manage admins" page: add/remove admins by email
4. [DONE] Risk zones + active disasters on the public map, updating live when
   admin saves
5. "How safe am I?" panel: Safe / Watch / Danger, distance and direction
   to nearest active disaster
6. Alerts + Simulate Disaster mode: zone expands over time, estimated
   arrival labelled "Simulation", on-screen + browser notification.
   Admin can trigger it.
7. Live rain radar overlay (RainViewer) with timeline play
8. Emergency contacts with one-tap call + nearest shelters/hospitals
9. NGOs and help groups active at a disaster site (map layer + list)
10. Offline support + language switcher (English, Assamese, Hindi, Bengali)
## Design direction
Follow design-reference/DESIGN.md and index.html exactly for all UI. Use the frontend-design skill.

## Alerts and life-saving flow
- Levels: Safe → Watch (within 25 km, not approaching) → Early warning
  (approaching, ETA shown) → Danger (inside zone or ETA < 30 min).
  Rhino mood follows the level.
- Loud alert on Early warning and Danger: Web Audio siren, vibration,
  full-screen banner/takeover, browser notification. "Turn on alerts"
  screen on first open.
- Alert shows: what disaster, how bad, time to arrival (labelled
  Estimate/Simulation), steps for that disaster type, nearest shelter
  outside the zone with route line + Google Maps link, call 112 / 1077 /
  nearest NGO, Alert family.
- Alert family: I'm safe / I need help → WhatsApp or SMS with location
  link; up to 3 contacts saved on the phone only.
- ETA: admin sets spread speed (km/h); ETA = distance to zone edge ÷ speed;
  Simulate grows the zone at that speed.

## Location-based help
- National numbers (112, 108, 101, 100) always shown first, for everyone
- District contacts: shown only for the user's current district (from GPS
  or demo location)
- Shelters, hospitals and NGOs: sorted by distance from the user; NGOs only
  within 30 km or linked to a nearby disaster; show distance on every item
- Empty state: "No help groups near you yet — call 112"
- Contacts table gets a "national" flag; admin picks district by map tap
  or dropdown
- Demo data: contacts, shelters and NGOs in at least Kamrup Metropolitan,
  East Khasi Hills (Shillong) and Dibrugarh, so switching demo location
  visibly changes the lists

## Demo mode (live presentation)
- Flow: admin adds disaster on laptop → phone updates live (<2 s) → admin
  presses Simulate → phone gets Early warning, then Danger → admin adds
  NGO → phone NGOs tab shows it
- Public app: long-press map sets a "demo location" (small pill shows it;
  tap to clear)
- Admin: presets ("Flood near demo location", "Landslide near demo
  location", "Add NGO at this disaster") and a "Reset demo" button

Build order: redesign → 4 → 5 → 6 → demo mode → 9 → 8 → deploy → 7 → 10.

## Rules
- Build one feature at a time; app must run after every step
- Never present demo or simulated data as live official data
- Keep components small and readable
- Never put secret keys in code; use .env.local
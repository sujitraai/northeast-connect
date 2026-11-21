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
- Base maps: Esri World Imagery (satellite) + Esri dark (no API keys)
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
4. Risk zones + active disasters on the public map, updating live when
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
- Use the frontend-design skill for all UI work
- Feels like a calm, serious emergency tool, not a generic AI template
- Dark map UI with high-contrast panels; avoid purple gradients
- Clear type hierarchy: big bold headings, short labels
- Status colours only for meaning: green Safe, amber Watch, red Danger
- Rounded cards with subtle shadows, consistent spacing
- Smooth but quick animations (alerts slide in, zones pulse)

## Rules
- Build one feature at a time; app must run after every step
- Never present demo or simulated data as live official data
- Keep components small and readable
- Never put secret keys in code; use .env.local
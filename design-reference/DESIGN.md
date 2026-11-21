# Northeast Connect – Design reference

Open `index.html` in a browser to see every screen. Match it closely.
The map in `index.html` is a drawn placeholder; in the app it is the real
Leaflet map. Everything else (cards, sheet, nav, buttons, mascot) should
look like the reference.

## Feel
- Friendly, soft and simple, built for common people, not tech users
- Light UI: background #F4F6FB, white cards, large rounded corners, soft shadows
- Short plain words, big type, icons next to every label
- Status colours only carry meaning: green = Safe, amber = Watch, red = Danger
- In real danger, clarity beats cuteness (see Danger takeover)

## Tokens
| Token | Value |
|---|---|
| Font | Plus Jakarta Sans (400–800), fallback system-ui |
| Background | #F4F6FB |
| Card | #FFFFFF |
| Ink / Ink-2 / Muted | #0F172A / #334155 / #64748B |
| Line | #E5E9F2 |
| Primary blue / soft | #2F5BEA / #E8EEFF |
| Navy (main buttons, active nav) | #0F1B3D |
| Safe / soft | #16A34A / #E6F6EC |
| Watch / soft | #D97706 / #FFF3DC |
| Early warning / soft | #EA580C / #FFEDD5 |
| Danger / soft | #DC2626 / #FDECEC |
| Radius | sheet 28px, cards 22px, inner cards 20px, buttons 16–18px, chips pill |
| Shadow | 0 10px 30px rgba(15,23,42,.10), 0 2px 6px rgba(15,23,42,.06) |

## Alert levels (drive the whole UI and the rhino)
| Level | When | Rhino | UI |
|---|---|---|---|
| Safe | nothing near | calm, green | top card "You're safe in …" |
| Watch | within ~25 km, not approaching | worried, amber | amber alert card in sheet |
| Early warning | approaching, ETA shown | scared, orange | LOUD alert + orange banner + route to shelter (screen 2b) |
| Danger | inside zone or ETA < 30 min | hidden | LOUD alert + red takeover (screen 3) |

## Turn on alerts (screen 0, first open only)
- Big rhino in a white circle with soft rings, "Turn on alerts", one-line promise
- Three permission rows with check marks: Loud siren, Vibration, Your location
- Navy "Turn on alerts" button; under it "Keep your phone off silent mode"
- This one tap unlocks Web Audio + notification + location permission

## Early warning (screen 2b)
- Siren (Web Audio) + vibration start; banner stays until muted
- Orange gradient banner at top: scared rhino tile, "EARLY WARNING · FLOOD",
  small line "Flood may reach you in", big "~1 hr 40 min", small "Moving towards you · Estimate";
  white footer strip: blinking "Siren on" + "Tap to mute"
- Map: orange zone with dashed arrow showing direction of travel, user dot,
  dotted navy route to the nearest shelter OUTSIDE the zone
- Sheet: "Go to a safe place now" green card (name, distance, walk time),
  "Start route" (navy) + "Google Maps"; one row of short action chips for the disaster type;
  "Call 112" (red) + "Alert family" (outline)

## Alert family (screen 6)
- Tall sheet: "I'm safe" (green soft) and "I need help" (solid red) as two big tiles
- Up to 3 saved contacts with checkboxes (saved on the phone only, no login)
- WhatsApp-style message preview with location link
- "WhatsApp" (#25D366) and "SMS" buttons; note "Numbers are saved only on this phone"

## Public app layout (mobile-first)
1. **Map**: always full-screen behind everything. Default style is light streets;
   satellite is an option. Nothing ever replaces the map except the Danger takeover.
2. **Top card**: floating white card (blurred, 92–94% white). Mascot on the left
   in a soft status-coloured tile; small grey line (greeting or area name), bold
   headline, one-line plain-language advice.
3. **Right rail**: 46px rounded-square white buttons: locate me, map style, rain radar.
   Active button = primary blue.
4. **Bottom sheet**: white, 28px top corners, drag handle.
   - Safe: two stat cards (Nearest danger, Your risk) + filter chips + "Get help now"
   - Watch: alert card (amber soft) with pills (WATCH · distance, Demo data, time) + "Get help now"
   - Keep it short so the map stays visible between the top card and the sheet.
5. **"Get help now"**: full-width navy button, 54px tall, red round phone icon.
6. **Floating pill nav**: Map, Alerts, Help, NGOs. Active tab = navy pill with icon +
   label; inactive = grey icon + small label. Red dot badge on Alerts when there's a new alert.
7. **Tabs (Help, NGOs, Alerts)**: open as a tall slide-up sheet over the map
   (top ≈ 150px), title + close button, chips to filter, then lists/cards.
8. **Desktop**: same components; sheet/tabs become a right sidebar (≈400px) and the
   map fills the rest.
9. No link to /admin anywhere on the public app.

## Danger takeover
- Full red header (radial red gradient), pulsing warning icon, "FLOOD DANGER" kicker,
  big instruction ("Move to higher ground"), time to arrival + "SIMULATION" tag when simulated
- White cards: "Do this now" (3 numbered steps) and "Nearest shelter" with directions button
- Bottom: big red "Call 112" + outline "I'm safe — tell my family"
- No mascot on this screen

## Lists
- Rows: soft grey background (#F4F6FB), 18px radius, coloured icon tile on the left,
  bold title + small grey sub-line, number, green round call button or blue round
  directions button on the right
- NGO cards: logo tile with initials, name, "On site · distance · Demo data",
  offer chips (emoji + text), Call (green) and Directions (white) buttons

## Mascot: baby one-horned rhino (original, flat SVG)
- Safe: green body, smiling
- Watch: amber body, worried brows, small sweat drop, frown
- Early warning (scared): orange body, wide eyes, open "O" mouth, two sweat drops
- Danger: red body, angry/alarmed; only used small (e.g. in lists); the takeover screen has no mascot
- Lives in the top card (64px tile) and the admin logo
- The SVG is in `index.html` (function `rhino(mood)`); reuse it as a React component

## Admin panel (/admin), desktop-first but must work on mobile
- Left sidebar (white): logo + "ADMIN", nav with counts (Overview, Disasters, Contacts,
  Shelters, NGOs, Admins), active item = primary soft background
- Page header: title, one-line help text, actions on the right (Simulate, Add disaster)
- KPI row: 4 white cards with coloured icon tiles
- Add/edit disaster: map card on the left (tap to place centre, radius ring shows live),
  form card on the right (type chips, severity segmented Watch/Danger, radius slider,
  district auto-filled with "AUTO" badge, description, toggles "Show on public map"
  and "Demo data", Save/Cancel)
- Tables: uppercase small headers, status pills, on/off switch for "Public",
  edit/delete icon buttons
- On mobile: sidebar becomes a bottom pill nav like the public app; map and form stack

## Honesty labels (always visible)
- "Demo data" pill on every demo item
- "SIMULATION" tag on any simulated arrival time
- Real helplines (112, 100, 101, 108, 1070, 1077) are shown without the demo tag

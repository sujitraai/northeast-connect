# Northeast Connect

Live, map-based early-warning platform for North East India. See `CLAUDE.md` for the full plan.

**Built so far:**
1. Full-screen map locked to the 8 NE states
2. Supabase database: tables, security rules (public read, admin write), demo data

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build / preview (includes the offline service worker):

```bash
npm run build
npm run preview    # http://localhost:4173
```

GPS ("locate me") needs `localhost` or HTTPS. To test on a phone on the same Wi-Fi, run
`npm run dev -- --host`. Browsers only allow location over HTTPS, so on a phone it works
once the app is deployed (Vercel).

## Supabase setup

The map runs without Supabase; data features need it.

1. Create a project at [supabase.com](https://supabase.com) (region: Mumbai).
2. **SQL Editor** → run, in order: `supabase/01_schema.sql`, `supabase/02_seed.sql`.
3. **Authentication** → turn off "Allow new users to sign up".
4. **Authentication → Users → Add user** (tick *Auto Confirm User*), then put that email
   into `supabase/03_make_admin.sql` and run it in the SQL Editor.
5. Copy `.env.example` to `.env.local` and paste the **Project URL** and the
   **publishable key** (never the secret key). Restart `npm run dev`.
6. `npm run db:check` to confirm everything is connected and locked down.

On Vercel, add the same two `VITE_SUPABASE_*` variables under
Project → Settings → Environment Variables.

**Security:** everyone can read; only users listed in `public.admins` can write.
Logging in is not enough on its own. All seeded rows except the national helpline numbers
(112, 100, 108, 101, 1070, 1077) have `is_demo = true` and must be shown as "Demo data".

## Data

| What | Source | Licence |
|---|---|---|
| State boundaries | [DataMeet `States/Admin2`](https://github.com/datameet/maps) | MIT |
| District boundaries | DataMeet `Districts/Census_2011` (2011 district set) | MIT |
| Satellite imagery | Esri World Imagery (no key) | Esri terms |
| Dark base map + labels | Esri Canvas Dark Gray Base / Reference (no key) | Esri terms |

The boundary files in `public/data/` are generated. To rebuild them:

```bash
npm run geo:build
```

This downloads the DataMeet shapefiles into `.geo-cache/`, keeps the 8 NE states,
simplifies them and writes `ne-states`, `ne-districts` and `ne-mask` GeoJSON files.

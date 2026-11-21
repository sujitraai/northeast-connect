# Northeast Connect

Live, map-based early-warning platform for North East India. See `CLAUDE.md` for the full plan.

**Built so far:** Feature 1 — full-screen map locked to the 8 NE states.

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

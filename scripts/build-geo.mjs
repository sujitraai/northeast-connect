// Builds the North East India boundary files used by the map.
//
// Source: DataMeet India maps (MIT) — https://github.com/datameet/maps
//   - States/Admin2.shp               (state boundaries)
//   - Districts/Census_2011/2011_Dist.shp (district boundaries, Census 2011)
//
// Output (public/data/):
//   - ne-states.geojson     8 NE states, simplified
//   - ne-districts.geojson  NE districts, simplified
//   - ne-mask.geojson       world polygon with a hole cut out for NE India
//
// Usage: npm run geo:build   (downloads raw files into .geo-cache/ on first run)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mapshaper from 'mapshaper';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.geo-cache');
const OUT = path.join(ROOT, 'public', 'data');
const BASE = 'https://raw.githubusercontent.com/datameet/maps/master';

const NE_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
];

const SOURCES = {
  states: { dir: 'States', name: 'Admin2', exts: ['shp', 'shx', 'dbf', 'prj', 'cpg'] },
  districts: { dir: 'Districts/Census_2011', name: '2011_Dist', exts: ['shp', 'shx', 'dbf', 'prj'] },
};

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function download({ dir, name, exts }) {
  await fs.mkdir(CACHE, { recursive: true });
  for (const ext of exts) {
    const dest = path.join(CACHE, `${name}.${ext}`);
    if (await exists(dest)) continue;
    const url = `${BASE}/${dir}/${name}.${ext}`;
    console.log(`Downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  return path.join(CACHE, `${name}.shp`).replaceAll('\\', '/');
}

const neFilter = `${JSON.stringify(NE_STATES)}.includes(ST_NM)`;

async function main() {
  const statesShp = await download(SOURCES.states);
  const districtsShp = await download(SOURCES.districts);
  await fs.mkdir(OUT, { recursive: true });
  const out = (f) => path.join(OUT, f).replaceAll('\\', '/');

  // States: keep NE only, simplify, rename field to `state`.
  await mapshaper.runCommands(
    `-i "${statesShp}" -filter '${neFilter}' ` +
      `-rename-fields state=ST_NM ` +
      `-simplify 6% keep-shapes ` +
      `-o "${out('ne-states.geojson')}" format=geojson precision=0.0001`,
  );

  // Districts: fix a source typo ("Arunanchal"), keep NE only, simplify,
  // tidy field names.
  await mapshaper.runCommands(
    `-i "${districtsShp}" ` +
      `-each 'if (ST_NM === "Arunanchal Pradesh") ST_NM = "Arunachal Pradesh"' ` +
      `-filter '${neFilter}' ` +
      `-each 'district=DISTRICT, state=ST_NM' -filter-fields district,state ` +
      `-simplify 12% keep-shapes ` +
      `-o "${out('ne-districts.geojson')}" format=geojson precision=0.0001`,
  );

  // Outline of the whole NE region (states dissolved into one shape).
  const outlinePath = path.join(CACHE, 'ne-outline.geojson').replaceAll('\\', '/');
  await mapshaper.runCommands(
    `-i "${out('ne-states.geojson')}" -dissolve2 -filter-slivers min-area=5km2 ` +
      `-o "${outlinePath}" format=geojson geojson-type=FeatureCollection precision=0.0001`,
  );

  // Mask = a big rectangle around the region with one hole per NE land polygon.
  const outline = JSON.parse(await fs.readFile(outlinePath, 'utf8'));
  const holes = [];
  for (const f of outline.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const p of polys) holes.push(p[0]);
  }
  const world = [[60, -10], [120, -10], [120, 50], [60, 50], [60, -10]];
  const masked = {
    type: 'Feature',
    properties: { note: 'Everything outside North East India' },
    geometry: { type: 'Polygon', coordinates: [world, ...holes] },
  };
  console.log(`Mask: ${holes.length} hole(s)`);
  await fs.writeFile(
    path.join(OUT, 'ne-mask.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: [masked] }),
  );

  // Report sizes, counts and bounds (bounds feed src/config/region.ts).
  for (const f of ['ne-states.geojson', 'ne-districts.geojson', 'ne-mask.geojson']) {
    const text = await fs.readFile(path.join(OUT, f), 'utf8');
    const json = JSON.parse(text);
    console.log(`${f}: ${(text.length / 1024).toFixed(0)} KB, ${json.features.length} features`);
  }
  const states = JSON.parse(await fs.readFile(path.join(OUT, 'ne-states.geojson'), 'utf8'));
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      minX = Math.min(minX, c[0]);
      maxX = Math.max(maxX, c[0]);
      minY = Math.min(minY, c[1]);
      maxY = Math.max(maxY, c[1]);
    } else c.forEach(walk);
  };
  states.features.forEach((f) => walk(f.geometry.coordinates));
  console.log(`NE bounds: [[${minY}, ${minX}], [${maxY}, ${maxX}]]  (lat/lng)`);
  console.log(`States: ${states.features.map((f) => f.properties.state).join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

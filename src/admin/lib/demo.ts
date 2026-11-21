import type { Disaster } from '../../lib/database.types';
import type { DemoLocation } from '../../lib/demo';
import { distanceKm, offsetPoint, type LatLng } from '../../lib/safety';
import { locatePlace, type DistrictsFC, type PlaceMatch, type StatesFC } from '../../lib/region';
import { supabase } from '../../lib/supabase';
import { friendlyError, inNeBox, notifyChange, saveRow } from './data';
import { GROUP_NAMES, OFFERS, pickSome, SHELTER_NAMES } from './demoNames';

const DEMO_SOURCE = 'Demo data';
/** Every row the demo buttons make: shown as "Demo data", removed by "Reset demo". */
const DEMO_ROW = { is_demo: true, source: DEMO_SOURCE, created_by_demo: true } as const;

const round = (p: LatLng) => ({ lat: Number(p.lat.toFixed(5)), lng: Number(p.lng.toFixed(5)) });

/** A point inside the 8 NE states, found by trying `make()` a few times. */
function findSpot(make: () => LatLng, states: StatesFC | null, districts: DistrictsFC | null) {
  for (let i = 0; i < 30; i++) {
    const p = make();
    const place = states ? locatePlace(p.lat, p.lng, states, districts) : null;
    if (place) return { ...p, place };
  }
  return null;
}

/** Bearing in degrees from a to b (0 = north). */
function bearing(a: LatLng, b: LatLng): number {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function client() {
  if (!supabase) throw new Error('Supabase is not connected.');
  return supabase;
}

const RADIUS_KM = 3;

/**
 * "Flood / Landslide near demo location": one disaster 8–10 km from the demo
 * location (radius 3 km, High, 5 km/h), plus
 *   - 2 help groups inside or at the edge of the zone, linked to it, and
 *   - 2 shelters 3–5 km beyond the demo location, on the side away from the
 *     zone, so they stay outside it while it grows towards the person.
 * All are Demo data and marked created_by_demo (removed by "Reset demo").
 */
export async function createDemoDisaster(
  type: 'flood' | 'landslide',
  demo: DemoLocation,
  states: StatesFC | null,
  districts: DistrictsFC | null,
): Promise<{ error: string | null; message: string }> {
  const spot = findSpot(() => offsetPoint(demo, 8 + Math.random() * 2, Math.random() * 360), states, districts);
  if (!spot) {
    return { error: 'Could not find a spot 8–10 km away inside North East India. Set the demo location further inside the region.', message: '' };
  }

  try {
    const db = client();
    const area = spot.place.district ?? spot.place.state;
    const { data: disaster, error } = await db
      .from('disasters')
      .insert({
        title: `Demo ${type} near ${area}`,
        type,
        severity: 'high',
        ...round(spot),
        radius_km: RADIUS_KM,
        spread_kmh: 5,
        state: spot.place.state,
        district: spot.place.district,
        description:
          type === 'flood'
            ? 'Demo: river water rising fast. Not a real event.'
            : 'Demo: slope giving way after heavy rain. Not a real event.',
        active: true,
        ...DEMO_ROW,
      })
      .select('id')
      .single();
    if (error || !disaster) return { error: friendlyError(error), message: '' };

    // Help groups: inside the zone or right at its edge.
    const groups = pickSome(GROUP_NAMES, 2).map((name, i) => ({
      name,
      focus: OFFERS[type][i],
      phone: null, // demo groups never get a real-looking number
      disaster_id: disaster.id,
      ...round(offsetPoint(spot, 0.8 + Math.random() * (RADIUS_KM - 0.8), Math.random() * 360)),
      active: true,
      ...DEMO_ROW,
    }));

    // Shelters: beyond the person, away from the zone (bearing zone → person, ±40°).
    const away = bearing(spot, demo);
    const shelterSpots: (LatLng & { place: PlaceMatch })[] = [];
    for (let i = 0; i < 2; i++) {
      const p = findSpot(() => offsetPoint(demo, 3 + Math.random() * 2, away + (Math.random() * 80 - 40)), states, districts);
      if (p && inNeBox(p.lat, p.lng)) shelterSpots.push(p);
    }
    const shelterNames = pickSome(SHELTER_NAMES, shelterSpots.length);
    const shelters = shelterSpots.map((p, i) => ({
      name: `${shelterNames[i]}, ${p.place.district ?? p.place.state}`,
      type: 'relief_camp' as const,
      ...round(p),
      capacity: 150 + Math.round(Math.random() * 25) * 10,
      phone: null,
      state: p.place.state,
      district: p.place.district,
      ...DEMO_ROW,
    }));

    const [g, s] = await Promise.all([db.from('ngos').insert(groups), db.from('shelters').insert(shelters)]);
    notifyChange();
    if (g.error || s.error) return { error: `The ${type} was added, but: ${friendlyError(g.error ?? s.error)}`, message: '' };

    const km = Math.round(distanceKm(demo, spot));
    return {
      error: null,
      message: `Demo ${type} added ${km} km from the demo location, with 2 help groups and ${shelters.length} shelter${shelters.length === 1 ? '' : 's'}. Press Simulate on it to start.`,
    };
  } catch (e) {
    return { error: friendlyError(e as Error), message: '' };
  }
}

/** "Add help group" on a disaster row: one demo group working there, linked to it. */
export async function addDemoNgo(d: Disaster): Promise<{ error: string | null; name: string }> {
  const [name] = pickSome(GROUP_NAMES, 1);
  const p = offsetPoint(d, Math.min(1, Number(d.radius_km) / 2), Math.random() * 360);
  const error = await saveRow('ngos', null, {
    name,
    focus: OFFERS[d.type][Math.floor(Math.random() * 2)],
    phone: null, // demo groups never get a real-looking number
    disaster_id: d.id,
    ...round(p),
    active: true,
    ...DEMO_ROW,
  });
  return { error, name };
}

export interface ResetPlan {
  /** Rows made by the demo buttons (the only rows that get deleted). */
  disasters: { id: string; title: string }[];
  ngos: { id: string; name: string }[];
  shelters: { id: string; name: string }[];
  /** Simulations running now. */
  simulations: number;
  /** Disasters whose radius was grown by Simulate and will go back to the original. */
  radii: { title: string; from: number; to: number }[];
}

/** What "Reset demo" would do (shown before asking to confirm). Changes nothing. */
export async function planReset(): Promise<ResetPlan | string> {
  try {
    const db = client();
    const [d, n, sh, grown] = await Promise.all([
      db.from('disasters').select('id, title').eq('created_by_demo', true).order('created_at'),
      db.from('ngos').select('id, name').eq('created_by_demo', true).order('created_at'),
      db.from('shelters').select('id, name').eq('created_by_demo', true).order('created_at'),
      db
        .from('disasters')
        .select('title, radius_km, sim_base_radius_km, sim_started_at, created_by_demo')
        .or('sim_started_at.not.is.null,sim_base_radius_km.not.is.null'),
    ]);
    const failed = d.error ?? n.error ?? sh.error ?? grown.error;
    if (failed) return friendlyError(failed);
    const rows = grown.data ?? [];
    return {
      disasters: d.data ?? [],
      ngos: n.data ?? [],
      shelters: sh.data ?? [],
      simulations: rows.filter((r) => r.sim_started_at).length,
      // Demo-button disasters are deleted anyway, so only list the ones that stay.
      radii: rows
        .filter((r) => !r.created_by_demo && r.sim_base_radius_km !== null)
        .map((r) => ({ title: r.title, from: Number(r.radius_km), to: Number(r.sim_base_radius_km) })),
    };
  } catch (e) {
    return friendlyError(e as Error);
  }
}

/**
 * Stops every simulation, puts simulated disasters back to their original
 * radius, and deletes only rows made by the demo buttons. Seed data and
 * hand-added rows are never touched. Runs as one step on the server.
 */
export async function resetDemo(): Promise<string | null> {
  try {
    const { error } = await client().rpc('reset_demo');
    if (error) return friendlyError(error);
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

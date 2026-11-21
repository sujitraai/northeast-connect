import type { Disaster } from '../../lib/database.types';
import type { DemoLocation } from '../../lib/demo';
import { offsetPoint } from '../../lib/safety';
import { locatePlace, type DistrictsFC, type StatesFC } from '../../lib/region';
import { supabase } from '../../lib/supabase';
import { friendlyError, notifyChange, saveRow } from './data';

const DEMO_SOURCE = 'Demo data';

/**
 * A disaster 8–10 km from the demo location, in a random direction that
 * stays inside North East India. Radius 3 km, High, spreads at 5 km/h.
 */
export async function createDemoDisaster(
  type: 'flood' | 'landslide',
  demo: DemoLocation,
  states: StatesFC | null,
  districts: DistrictsFC | null,
): Promise<string | null> {
  let spot = null;
  for (let i = 0; i < 24 && !spot; i++) {
    const p = offsetPoint(demo, 8 + Math.random() * 2, Math.random() * 360);
    const place = states ? locatePlace(p.lat, p.lng, states, districts) : null;
    if (place) spot = { ...p, place };
  }
  if (!spot) return 'Could not find a spot 8–10 km away inside North East India. Set the demo location further inside the region.';

  const area = spot.place.district ?? spot.place.state;
  return saveRow('disasters', null, {
    title: `Demo ${type} near ${area}`,
    type,
    severity: 'high',
    lat: Number(spot.lat.toFixed(5)),
    lng: Number(spot.lng.toFixed(5)),
    radius_km: 3,
    spread_kmh: 5,
    state: spot.place.state,
    district: spot.place.district,
    description:
      type === 'flood'
        ? 'Demo: river water rising fast. Not a real event.'
        : 'Demo: slope giving way after heavy rain. Not a real event.',
    active: true,
    is_demo: true,
    source: DEMO_SOURCE,
    created_by_demo: true,
  });
}

const NGO_NAMES = [
  { name: 'Brahmaputra Relief Volunteers', focus: '🚤 Rescue boats, 🍚 food packets, 40 volunteers' },
  { name: 'Hills Medical Aid', focus: '🩺 First aid, 💊 medicines' },
  { name: 'Northeast Youth Rescue Team', focus: '🧭 Search and rescue, 🔦 night help' },
  { name: 'Village Kitchen Network', focus: '🍲 Hot meals, 💧 drinking water' },
];

/** A demo NGO working at the disaster (1 km from its centre), linked to it. */
export async function addDemoNgo(d: Disaster): Promise<{ error: string | null; name: string }> {
  const pick = NGO_NAMES[Math.floor(Math.random() * NGO_NAMES.length)];
  const p = offsetPoint(d, Math.min(1, Number(d.radius_km) / 2), Math.random() * 360);
  const error = await saveRow('ngos', null, {
    name: pick.name,
    focus: pick.focus,
    phone: null, // demo groups never get a real-looking number
    disaster_id: d.id,
    lat: Number(p.lat.toFixed(5)),
    lng: Number(p.lng.toFixed(5)),
    active: true,
    is_demo: true,
    source: DEMO_SOURCE,
    created_by_demo: true,
  });
  return { error, name: pick.name };
}

export interface ResetPlan {
  /** Rows made by the demo buttons (the only rows that get deleted). */
  disasters: { id: string; title: string }[];
  ngos: { id: string; name: string }[];
  /** Simulations running now. */
  simulations: number;
  /** Disasters whose radius was grown by Simulate and will go back to the original. */
  radii: { title: string; from: number; to: number }[];
}

function client() {
  if (!supabase) throw new Error('Supabase is not connected.');
  return supabase;
}

/** What "Reset demo" would do (shown before asking to confirm). Changes nothing. */
export async function planReset(): Promise<ResetPlan | string> {
  try {
    const db = client();
    const [d, n, grown] = await Promise.all([
      db.from('disasters').select('id, title').eq('created_by_demo', true).order('created_at'),
      db.from('ngos').select('id, name').eq('created_by_demo', true).order('created_at'),
      db
        .from('disasters')
        .select('title, radius_km, sim_base_radius_km, sim_started_at, created_by_demo')
        .or('sim_started_at.not.is.null,sim_base_radius_km.not.is.null'),
    ]);
    const failed = d.error ?? n.error ?? grown.error;
    if (failed) return friendlyError(failed);
    const rows = grown.data ?? [];
    return {
      disasters: d.data ?? [],
      ngos: n.data ?? [],
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

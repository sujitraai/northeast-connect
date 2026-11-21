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
  });
  return { error, name: pick.name };
}

const TABLES = ['ngos', 'disasters', 'shelters', 'contacts', 'risk_zones'] as const;
type DemoTable = (typeof TABLES)[number];

export interface ResetPlan {
  counts: Record<DemoTable, number>;
  simulations: number;
}

/** Local midnight today, as an ISO time. */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

function client() {
  if (!supabase) throw new Error('Supabase is not connected.');
  return supabase;
}

/** What "Reset demo" would delete / stop (shown before asking to confirm). */
export async function planReset(): Promise<ResetPlan | string> {
  try {
    const db = client();
    const since = startOfToday();
    const counts = {} as Record<DemoTable, number>;
    for (const t of TABLES) {
      const { count, error } = await db.from(t).select('id', { count: 'exact', head: true }).eq('is_demo', true).gte('created_at', since);
      if (error) return friendlyError(error);
      counts[t] = count ?? 0;
    }
    const sims = await db.from('disasters').select('id', { count: 'exact', head: true }).not('sim_started_at', 'is', null);
    return { counts, simulations: sims.error ? 0 : (sims.count ?? 0) };
  } catch (e) {
    return friendlyError(e as Error);
  }
}

/** Stops every simulation, then deletes demo-data items created today. */
export async function resetDemo(): Promise<string | null> {
  try {
    const db = client();
    const running = await db.from('disasters').select('id').not('sim_started_at', 'is', null);
    // Missing column = 05_simulation.sql not run: nothing can be simulating.
    for (const r of running.data ?? []) {
      const { error } = await db.rpc('stop_simulation', { p_id: r.id });
      if (error) return friendlyError(error);
    }
    const since = startOfToday();
    // NGOs first: they point at disasters.
    for (const t of TABLES) {
      const { error } = await db.from(t).delete().eq('is_demo', true).gte('created_at', since);
      if (error) return friendlyError(error);
    }
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

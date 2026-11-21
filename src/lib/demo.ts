/**
 * Demo mode: a phone long-presses the map to set a "demo location". It is
 * shared with the admin panel through a Supabase Realtime presence channel
 * (nothing is written to the database; the public app stays read-only).
 */
export const DEMO_CHANNEL = 'demo-location';

export interface DemoLocation {
  lat: number;
  lng: number;
  /** When it was set (ms). */
  at: number;
}

const isDemoLocation = (v: unknown): v is DemoLocation =>
  typeof v === 'object' && v !== null && ['lat', 'lng', 'at'].every((k) => typeof (v as Record<string, unknown>)[k] === 'number');

/** The most recently set demo location among all connected phones. */
export function latestDemo(state: Record<string, unknown[]>): DemoLocation | null {
  let best: DemoLocation | null = null;
  for (const list of Object.values(state)) {
    for (const p of list) {
      if (isDemoLocation(p) && (!best || p.at > best.at)) best = { lat: p.lat, lng: p.lng, at: p.at };
    }
  }
  return best;
}

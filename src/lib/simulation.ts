import type { Disaster } from './database.types';

/** 1 real second = 1 simulated minute. Same number as supabase/05_simulation.sql. */
export const SIM_FACTOR = 60;
export const MAX_RADIUS_KM = 300;
export const DEFAULT_SPREAD_KMH = 3;

export const isSimulating = (d: Disaster): boolean => Boolean(d.sim_started_at);

/** Spread speed in km/h (falls back to 3 before 05_simulation.sql is run). */
export const speedOf = (d: Disaster): number => {
  const v = Number(d.spread_kmh ?? DEFAULT_SPREAD_KMH);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_SPREAD_KMH;
};

/** Radius right now: grows while a simulation runs. */
export function currentRadius(d: Disaster, now: number): number {
  const base = Number(d.radius_km);
  if (!d.sim_started_at) return base;
  const simHours = (Math.max(0, now - Date.parse(d.sim_started_at)) / 3_600_000) * SIM_FACTOR;
  return Math.min(MAX_RADIUS_KM, base + speedOf(d) * simHours);
}

/** The disaster with its radius as it is at `now`. */
export const withCurrentRadius = (d: Disaster, now: number): Disaster =>
  d.sim_started_at ? { ...d, radius_km: currentRadius(d, now) } : d;

/** "~1 hr 40 min", "~25 min", "~3 hrs" (rounded to 5 minutes, at least 5). */
export function formatEta(hours: number): string {
  const mins = Math.max(5, Math.round((hours * 60) / 5) * 5);
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `~${h} hr${h === 1 ? '' : 's'}` : `~${h} hr ${m} min`;
}

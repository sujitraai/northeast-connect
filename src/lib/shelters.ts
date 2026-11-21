import type { Disaster, Shelter } from './database.types';
import { distanceKm, type LatLng } from './safety';
import { isSimulating, speedOf } from './simulation';

/** Walking speed used for "~22 min walk" (km/h). */
const WALK_KMH = 4.5;

export interface ShelterPick {
  shelter: Shelter;
  /** Straight-line distance from the person. */
  km: number;
  walkMin: number;
}

/**
 * Nearest shelter OUTSIDE the disaster area. `d.radius_km` must be the
 * current radius (see withCurrentRadius). For a growing area it prefers one
 * that stays outside for as long as it takes to walk there; if none does,
 * the nearest one that is outside right now.
 */
export function safeShelter(from: LatLng, shelters: Shelter[], d: Disaster): ShelterPick | null {
  const radius = Number(d.radius_km); // already "now"
  let best: ShelterPick | null = null;
  // Fallback: outside the area right now, even if it may grow to reach it.
  let outsideNow: ShelterPick | null = null;
  for (const s of shelters) {
    const km = distanceKm(from, s);
    const walkH = km / WALK_KMH;
    const pick = { shelter: s, km, walkMin: Math.max(1, Math.round(walkH * 60)) };
    const fromCentre = distanceKm(d, s);
    if (fromCentre <= radius + 1) continue; // inside the area (+1 km margin)
    if (!outsideNow || km < outsideNow.km) outsideNow = pick;
    const growth = isSimulating(d) ? speedOf(d) * (walkH + 0.5) : 0;
    if (fromCentre <= radius + growth + 1) continue; // would be reached before you get there
    if (!best || km < best.km) best = pick;
  }
  return best ?? outsideNow;
}

/** Google Maps walking directions (real roads), from the person to the shelter. */
export function mapsLink(from: LatLng | null, to: LatLng): string {
  const dest = `${to.lat},${to.lng}`;
  const origin = from ? `&origin=${from.lat},${from.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=walking`;
}

/** "22 min walk", "1 hr 10 min walk". */
export function walkText(min: number): string {
  if (min < 60) return `~${min} min walk`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `~${h} hr${m ? ` ${m} min` : ''} walk`;
}

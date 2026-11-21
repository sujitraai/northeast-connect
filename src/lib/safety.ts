import centroid from '@turf/centroid';
import pointToPolygonDistance from '@turf/point-to-polygon-distance';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { Disaster } from './database.types';
import { isSimulating, speedOf } from './simulation';

/** "Watch" = an active disaster's area is within this distance. */
export const WATCH_KM = 25;
/** "Danger" = the area may reach you sooner than this (hours). */
export const DANGER_ETA_H = 0.5;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Where the person is: a GPS fix, or a district they picked from the list. */
export type Here =
  | { kind: 'gps'; at: LatLng; district: string | null; state: string }
  | { kind: 'district'; at: LatLng; district: string; state: string; shape: Feature<Polygon | MultiPolygon> };

/**
 * Safe → Watch (within 25 km, not approaching) → Early warning (approaching,
 * ETA shown) → Danger (inside the area, or ETA under 30 min).
 */
export type SafetyLevel = 'safe' | 'watch' | 'early' | 'danger';
const RANK: Record<SafetyLevel, number> = { safe: 0, watch: 1, early: 2, danger: 3 };
export const atLeast = (a: SafetyLevel, b: SafetyLevel) => RANK[a] >= RANK[b];

export interface Nearest {
  disaster: Disaster;
  /** Distance to the edge of the affected area (0 = touching / inside). */
  edgeKm: number;
  /** e.g. "north-east" — from the person (or the district centre) to the disaster. */
  direction: string;
  /** The GPS point is inside the area (district mode: the area reaches the district). */
  inside: boolean;
  /** The area is growing towards the person (a running simulation). */
  approaching: boolean;
  /** Hours until the edge reaches the person, when approaching. */
  etaHours: number | null;
  level: SafetyLevel;
}

export interface Safety {
  level: SafetyLevel;
  /** Closest disaster (for distance and direction). */
  nearest: Nearest | null;
  /** The disaster behind the level (highest level, then soonest / closest). */
  lead: Nearest | null;
}

const R = 6371; // km
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

/** Compass direction (8 points) from a to b, in plain words. */
export function direction(a: LatLng, b: LatLng): string {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return COMPASS[Math.round(deg / 45) % 8];
}

/** Centre point of a district shape (used to give a direction in district mode). */
export function centreOf(shape: Feature<Polygon | MultiPolygon>): LatLng {
  const [lng, lat] = centroid(shape).geometry.coordinates;
  return { lat, lng };
}

/** Distance from the person (or their whole district) to a disaster's affected area. */
function edgeDistance(here: Here, d: Disaster): number {
  const radius = Number(d.radius_km);
  if (here.kind === 'gps') return Math.max(0, distanceKm(here.at, d) - radius);
  // District mode: closest point of the district to the disaster centre.
  const toDistrict = Math.max(0, pointToPolygonDistance(point([d.lng, d.lat]), here.shape, { units: 'kilometers' }));
  return Math.max(0, toDistrict - radius);
}

/** One disaster, seen from where the person is. */
function threat(here: Here, d: Disaster): Nearest {
  const edgeKm = edgeDistance(here, d);
  const inside = here.kind === 'gps' ? distanceKm(here.at, d) <= Number(d.radius_km) : edgeKm === 0;
  // Only a growing area (a running simulation) moves towards people.
  const speed = speedOf(d);
  const approaching = isSimulating(d) && speed > 0 && !inside;
  const etaHours = approaching ? edgeKm / speed : null;

  let level: SafetyLevel = 'safe';
  if (inside && (here.kind === 'gps' || isSimulating(d))) level = 'danger';
  else if (etaHours !== null && etaHours < DANGER_ETA_H) level = 'danger';
  else if (approaching && edgeKm <= WATCH_KM) level = 'early';
  else if (edgeKm <= WATCH_KM) level = 'watch';

  return { disaster: d, edgeKm, direction: direction(here.at, d), inside, approaching, etaHours, level };
}

/** How safe am I? Looks at every active disaster and keeps the worst. */
export function assess(here: Here, disasters: Disaster[]): Safety {
  let nearest: Nearest | null = null;
  let lead: Nearest | null = null;
  for (const d of disasters) {
    const t = threat(here, d);
    if (!nearest || t.edgeKm < nearest.edgeKm) nearest = t;
    if (
      !lead ||
      RANK[t.level] > RANK[lead.level] ||
      (t.level === lead.level && (t.etaHours ?? Infinity) < (lead.etaHours ?? Infinity)) ||
      (t.level === lead.level && t.etaHours === lead.etaHours && t.edgeKm < lead.edgeKm)
    ) {
      lead = t;
    }
  }
  return { level: lead?.level ?? 'safe', nearest, lead };
}

/** "12 km", "4.5 km" or "800 m". */
export function formatKm(km: number): string {
  if (km <= 0) return '0 km';
  if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, '') : Math.round(km)} km`;
}

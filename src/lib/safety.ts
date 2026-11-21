import centroid from '@turf/centroid';
import pointToPolygonDistance from '@turf/point-to-polygon-distance';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { Disaster } from './database.types';

/** "Watch" = an active disaster's area is within this distance. */
export const WATCH_KM = 25;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Where the person is: a GPS fix, or a district they picked from the list. */
export type Here =
  | { kind: 'gps'; at: LatLng; district: string | null; state: string }
  | { kind: 'district'; at: LatLng; district: string; state: string; shape: Feature<Polygon | MultiPolygon> };

export type SafetyLevel = 'safe' | 'watch' | 'inside';

export interface Nearest {
  disaster: Disaster;
  /** Distance to the edge of the affected area (0 = touching / inside). */
  edgeKm: number;
  /** e.g. "north-east" — from the person (or the district centre) to the disaster. */
  direction: string;
}

export interface Safety {
  level: SafetyLevel;
  nearest: Nearest | null;
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

/**
 * How safe am I? Safe = no active disaster within 25 km; Watch = one is.
 * "inside" = the GPS point is inside an affected area (district mode can
 * only say the area reaches the district, so it stays at Watch).
 */
export function assess(here: Here, disasters: Disaster[]): Safety {
  let nearest: Nearest | null = null;
  for (const d of disasters) {
    const edgeKm = edgeDistance(here, d);
    if (!nearest || edgeKm < nearest.edgeKm) {
      nearest = { disaster: d, edgeKm, direction: direction(here.at, d) };
    }
  }
  if (!nearest || nearest.edgeKm > WATCH_KM) return { level: 'safe', nearest };
  const inside = here.kind === 'gps' && distanceKm(here.at, nearest.disaster) <= Number(nearest.disaster.radius_km);
  return { level: inside ? 'inside' : 'watch', nearest };
}

/** "12 km", "4.5 km" or "800 m". */
export function formatKm(km: number): string {
  if (km <= 0) return '0 km';
  if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, '') : Math.round(km)} km`;
}

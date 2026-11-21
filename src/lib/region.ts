import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export interface StateProps {
  state: string;
}
export interface DistrictProps {
  district: string;
  state: string;
}

export type StatesFC = FeatureCollection<Polygon | MultiPolygon, StateProps>;
export type DistrictsFC = FeatureCollection<Polygon | MultiPolygon, DistrictProps>;

export interface PlaceMatch {
  state: string;
  district: string | null;
}

/**
 * Finds which NE state (and district) a GPS point falls in.
 * Returns null when the point is outside all 8 NE states.
 */
export function locatePlace(
  lat: number,
  lng: number,
  states: StatesFC,
  districts: DistrictsFC | null,
): PlaceMatch | null {
  const p = point([lng, lat]);
  const state = states.features.find((f) => booleanPointInPolygon(p, f));
  if (!state) return null;
  const district =
    districts?.features.find(
      (f) => f.properties.state === state.properties.state && booleanPointInPolygon(p, f),
    ) ?? null;
  return { state: state.properties.state, district: district?.properties.district ?? null };
}

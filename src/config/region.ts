import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

/** Exact extent of the 8 NE states (from scripts/build-geo.mjs output). */
export const NE_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [21.94, 88.01],
  [29.46, 97.41],
];

/** Panning limit: the NE extent plus a small margin so edges aren't cramped. */
export const MAX_BOUNDS: LatLngBoundsExpression = [
  [21.2, 87.3],
  [30.2, 98.2],
];

export const NE_CENTER: LatLngTuple = [26.2, 92.9];

export const MAX_ZOOM = 18;

/** Hand-placed label points (centroids look odd for Assam's shape). */
export const STATE_LABELS: { name: string; at: LatLngTuple }[] = [
  { name: 'Arunachal Pradesh', at: [28.0, 93.7] },
  { name: 'Assam', at: [26.35, 92.75] },
  { name: 'Meghalaya', at: [25.55, 91.3] },
  { name: 'Nagaland', at: [26.1, 94.45] },
  { name: 'Manipur', at: [24.75, 93.85] },
  { name: 'Mizoram', at: [23.35, 92.8] },
  { name: 'Tripura', at: [23.75, 91.7] },
  { name: 'Sikkim', at: [27.55, 88.45] },
];

export const DATA_URLS = {
  states: `${import.meta.env.BASE_URL}data/ne-states.geojson`,
  districts: `${import.meta.env.BASE_URL}data/ne-districts.geojson`,
  mask: `${import.meta.env.BASE_URL}data/ne-mask.geojson`,
};

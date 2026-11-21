export type BaseMapId = 'satellite' | 'dark';

interface TileDef {
  url: string;
  attribution: string;
  maxNativeZoom: number;
}

// All Esri tile services below are keyless. (CARTO's dark tiles now return
// an "API key required" watermark, so they are not used.)
//
// Boundaries come only from our own India-specific GeoJSON; the place-name
// layer is label-only (no border lines).
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

const LABELS: TileDef = {
  url: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  attribution: 'Labels &copy; Esri',
  maxNativeZoom: 16,
};

export const BASE_MAPS: Record<BaseMapId, { base: TileDef; labels: TileDef }> = {
  satellite: {
    base: {
      url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
      attribution:
        'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxNativeZoom: 18,
    },
    labels: LABELS,
  },
  dark: {
    base: {
      url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
      attribution: 'Base map &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      maxNativeZoom: 16,
    },
    labels: LABELS,
  },
};

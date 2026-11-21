export type BaseMapId = 'streets' | 'satellite';

interface TileDef {
  url: string;
  attribution: string;
  maxNativeZoom: number;
}

// All Esri tile services below are keyless. (CARTO tiles now return an
// "API key required" watermark, so they are not used.)
//
// Boundaries come only from our own India-specific GeoJSON; the place-name
// layers are label-only (no border lines).
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

export const BASE_MAPS: Record<BaseMapId, { base: TileDef; labels: TileDef }> = {
  streets: {
    base: {
      url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
      attribution: 'Base map &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
      maxNativeZoom: 16,
    },
    labels: {
      url: `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
      attribution: 'Labels &copy; Esri',
      maxNativeZoom: 16,
    },
  },
  satellite: {
    base: {
      url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxNativeZoom: 18,
    },
    labels: {
      url: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
      attribution: 'Labels &copy; Esri',
      maxNativeZoom: 16,
    },
  },
};

/** Boundary + mask styling that reads well on each base map. */
export const MAP_STYLES: Record<
  BaseMapId,
  { mask: string; maskOpacity: number; state: string; district: string; districtOpacity: number }
> = {
  // Light map: wash the rest of the world out to near-white.
  streets: { mask: '#F4F6FB', maskOpacity: 0.82, state: '#2F5BEA', district: '#64748B', districtOpacity: 0.55 },
  // Satellite: darken the rest of the world.
  satellite: { mask: '#0F172A', maskOpacity: 0.62, state: '#FFFFFF', district: '#E2E8F0', districtOpacity: 0.5 },
};

import { createContext, useContext } from 'react';
import type { GeoData } from '../hooks/useGeoData';

/** Boundary data, loaded once for the whole admin panel. */
export const GeoContext = createContext<GeoData>({
  states: null,
  districts: null,
  mask: null,
  error: null,
});

export const useGeo = () => useContext(GeoContext);

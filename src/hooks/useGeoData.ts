import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import { DATA_URLS } from '../config/region';
import type { DistrictsFC, StatesFC } from '../lib/region';

export interface GeoData {
  states: StatesFC | null;
  districts: DistrictsFC | null;
  mask: FeatureCollection | null;
  error: string | null;
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Loads the NE boundary files. Each layer appears as soon as it arrives. */
export function useGeoData(): GeoData {
  const [data, setData] = useState<GeoData>({
    states: null,
    districts: null,
    mask: null,
    error: null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const fail = (err: unknown) => {
      if (ctrl.signal.aborted) return;
      console.error(err);
      setData((d) => ({ ...d, error: 'Could not load map boundaries' }));
    };
    getJson<FeatureCollection>(DATA_URLS.mask, ctrl.signal)
      .then((mask) => setData((d) => ({ ...d, mask })))
      .catch(fail);
    getJson<StatesFC>(DATA_URLS.states, ctrl.signal)
      .then((states) => setData((d) => ({ ...d, states })))
      .catch(fail);
    getJson<DistrictsFC>(DATA_URLS.districts, ctrl.signal)
      .then((districts) => setData((d) => ({ ...d, districts })))
      .catch(fail);
    return () => ctrl.abort();
  }, []);

  return data;
}

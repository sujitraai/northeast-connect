import { useCallback, useEffect, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import MapView from './components/MapView';
import MapButton from './components/MapButton';
import InfoCard, { type CardTone } from './components/InfoCard';
import { LocateIcon, MoonIcon, SatelliteIcon, Spinner } from './components/icons';
import type { BaseMapId } from './config/basemaps';
import { NE_BOUNDS } from './config/region';
import { useGeoData } from './hooks/useGeoData';
import { useGeolocation } from './hooks/useGeolocation';
import { locatePlace, type DistrictProps } from './lib/region';

interface Card {
  tone: CardTone;
  title: string;
  body?: string;
}

const BASEMAP_KEY = 'nec.basemap';

function loadBaseMap(): BaseMapId {
  try {
    const v = localStorage.getItem(BASEMAP_KEY);
    if (v === 'satellite' || v === 'dark') return v;
  } catch {
    /* storage unavailable */
  }
  return 'satellite';
}

export default function App() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [baseMap, setBaseMap] = useState<BaseMapId>(loadBaseMap);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProps | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [userInRegion, setUserInRegion] = useState(false);

  const geo = useGeoData();
  const { status, position, error: locateError, locate } = useGeolocation();

  const toggleBaseMap = () => {
    const next: BaseMapId = baseMap === 'satellite' ? 'dark' : 'satellite';
    setBaseMap(next);
    try {
      localStorage.setItem(BASEMAP_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  // Report a location error.
  useEffect(() => {
    if (status === 'error' && locateError) {
      setCard({ tone: 'error', title: 'Location not available', body: locateError });
    }
  }, [status, locateError]);

  // When a GPS fix arrives (and the state shapes are loaded), work out where
  // the user is and move the map. Runs once per fix.
  useEffect(() => {
    if (!position || !geo.states || !map) return;
    const place = locatePlace(position.lat, position.lng, geo.states, geo.districts);
    if (place) {
      setUserInRegion(true);
      setSelectedDistrict(place.district ? { district: place.district, state: place.state } : null);
      setCard({
        tone: 'info',
        title: place.district ? `You are in ${place.district}` : `You are in ${place.state}`,
        body: place.district ? place.state : undefined,
      });
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 11), { duration: 1.2 });
    } else {
      setUserInRegion(false);
      setCard({
        tone: 'warning',
        title: 'You are outside North East India',
        body: 'This app covers the 8 North East states only. You can still explore the map.',
      });
      map.flyToBounds(NE_BOUNDS, { duration: 1 });
    }
    // geo.districts deliberately omitted: a late district load shouldn't re-fly the map.
  }, [position, geo.states, map]);

  const onSelectDistrict = useCallback((d: DistrictProps | null) => {
    setSelectedDistrict(d);
    setCard(d ? { tone: 'info', title: d.district, body: d.state } : null);
  }, []);

  const onMapReady = useCallback((m: LeafletMap) => setMap(m), []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b0f14]">
      <MapView
        baseMap={baseMap}
        geo={geo}
        userPosition={userInRegion ? position : null}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={onSelectDistrict}
        onMapReady={onMapReady}
      />

      {/* Top: app name */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-start p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-2 shadow-lg backdrop-blur">
          <h1 className="text-base font-bold leading-tight text-white">Northeast Connect</h1>
          <p className="text-xs text-slate-400">North East India</p>
        </div>
      </header>

      {/* Right: map controls */}
      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[1000] flex flex-col gap-3">
        <MapButton
          label={baseMap === 'satellite' ? 'Switch to dark map' : 'Switch to satellite map'}
          onClick={toggleBaseMap}
        >
          {baseMap === 'satellite' ? <MoonIcon /> : <SatelliteIcon />}
        </MapButton>
        <MapButton
          label="Show my location"
          onClick={locate}
          active={userInRegion && status === 'found'}
          disabled={status === 'locating'}
        >
          {status === 'locating' ? <Spinner /> : <LocateIcon />}
        </MapButton>
      </div>

      {/* Bottom: status card */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+1.25rem))]">
        {geo.error ? (
          <InfoCard tone="error" title={geo.error} onClose={() => window.location.reload()}>
            Check your connection. Tap × to retry.
          </InfoCard>
        ) : (
          card && (
            <InfoCard
              tone={card.tone}
              title={card.title}
              onClose={() => {
                setCard(null);
                setSelectedDistrict(null);
              }}
            >
              {card.body}
            </InfoCard>
          )
        )}
      </div>
    </div>
  );
}

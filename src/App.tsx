import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import MapView from './components/MapView';
import MapButton from './components/MapButton';
import TopCard, { CardAction, type TopCardContent } from './components/TopCard';
import BottomNav, { type TabId } from './components/BottomNav';
import { GetHelpButton, Handle } from './components/sheet';
import AlertsTab from './components/tabs/AlertsTab';
import HelpTab from './components/tabs/HelpTab';
import NgosTab from './components/tabs/NgosTab';
import { Icon, Spinner } from './components/icons';
import type { BaseMapId } from './config/basemaps';
import { NE_BOUNDS } from './config/region';
import { useGeoData } from './hooks/useGeoData';
import { useGeolocation } from './hooks/useGeolocation';
import { locatePlace, type DistrictProps, type PlaceMatch } from './lib/region';

const BASEMAP_KEY = 'nec.basemap';

function loadBaseMap(): BaseMapId {
  try {
    if (localStorage.getItem(BASEMAP_KEY) === 'satellite') return 'satellite';
  } catch {
    /* storage unavailable */
  }
  return 'streets';
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// "neutral" tile until the safety check (feature 5) can say Safe / Watch / Danger.
const CALM = { mood: 'safe', tone: 'neutral' } as const;

export default function App() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [baseMap, setBaseMap] = useState<BaseMapId>(loadBaseMap);
  const [tab, setTab] = useState<TabId>('map');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProps | null>(null);
  // undefined = not located yet; null = located, but outside North East India.
  const [userPlace, setUserPlace] = useState<PlaceMatch | null | undefined>(undefined);

  const geo = useGeoData();
  const { status, position, error: locateError, locate } = useGeolocation();

  const toggleBaseMap = () => {
    const next: BaseMapId = baseMap === 'satellite' ? 'streets' : 'satellite';
    setBaseMap(next);
    try {
      localStorage.setItem(BASEMAP_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  // When a GPS fix arrives (and the state shapes are loaded), work out where
  // the user is and move the map. Runs once per fix.
  useEffect(() => {
    if (!position || !geo.states || !map) return;
    const place = locatePlace(position.lat, position.lng, geo.states, geo.districts);
    setUserPlace(place);
    setSelectedDistrict(null);
    if (place) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 11), { duration: 1.2 });
    } else {
      map.flyToBounds(NE_BOUNDS, { duration: 1 });
    }
    // geo.districts deliberately omitted: a late district load shouldn't re-fly the map.
  }, [position, geo.states, map]);

  const onSelectDistrict = useCallback((d: DistrictProps | null) => setSelectedDistrict(d), []);
  const onMapReady = useCallback((m: LeafletMap) => setMap(m), []);

  const inRegion = Boolean(userPlace) && status === 'found';
  const locating = status === 'locating';

  // --- Top card: what to tell the person right now ---
  let card: TopCardContent;
  let action: ReactNode = null;
  let onCardClose: (() => void) | undefined;
  const findMe = (
    <CardAction icon={locating ? <Spinner size={16} /> : <Icon name="locate" size={16} />} onClick={locate} busy={locating}>
      {locating ? 'Finding you…' : 'Find me'}
    </CardAction>
  );

  if (geo.error) {
    card = { ...CALM, greet: 'Northeast Connect', headline: 'The map did not fully load', bubble: 'Check your internet connection, then try again.' };
    action = (
      <CardAction onClick={() => window.location.reload()}>
        Try again
      </CardAction>
    );
  } else if (selectedDistrict) {
    card = { ...CALM, greet: 'District', headline: selectedDistrict.district, bubble: selectedDistrict.state };
    onCardClose = () => setSelectedDistrict(null);
  } else if (status === 'error' && locateError) {
    card = { ...CALM, greet: greeting(), headline: 'Cannot find your location', bubble: locateError };
    action = findMe;
  } else if (userPlace) {
    card = {
      ...CALM,
      greet: userPlace.district ? `${userPlace.district}, ${userPlace.state}` : userPlace.state,
      headline: `You're in ${userPlace.district ?? userPlace.state}`,
      bubble: 'Tap any district on the map to see its name.',
    };
  } else if (userPlace === null) {
    card = {
      ...CALM,
      greet: greeting(),
      headline: "You're outside North East India",
      bubble: 'This app covers the 8 North East states. You can still look around the map.',
    };
  } else {
    card = { ...CALM, greet: greeting(), headline: 'Welcome to Northeast Connect', bubble: 'Find where you are to see your area on the map.' };
    action = findMe;
  }

  const onMap = tab === 'map';
  const backToMap = () => setTab('map');

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {/* Map: full screen on phones, everything left of the sidebar on desktop. */}
      <div className="absolute inset-0 lg:right-[400px]">
        <MapView
          baseMap={baseMap}
          geo={geo}
          userPosition={inRegion ? position : null}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={onSelectDistrict}
          onMapReady={onMapReady}
        />
      </div>

      {/* Top card + right rail. Hidden on phones while a tall tab is open. */}
      <div
        className={`pointer-events-none absolute inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-[1000] flex flex-col gap-3 lg:right-[412px] ${
          onMap ? '' : 'max-lg:hidden'
        }`}
      >
        <div className="lg:max-w-[400px]">
          <TopCard {...card} action={action} onClose={onCardClose} />
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <MapButton label="Show my location" onClick={locate} active={inRegion} disabled={locating}>
            {locating ? <Spinner /> : <Icon name="locate" size={22} />}
          </MapButton>
          <MapButton
            label={baseMap === 'satellite' ? 'Show street map' : 'Show satellite map'}
            onClick={toggleBaseMap}
            active={baseMap === 'satellite'}
          >
            <Icon name="layers" size={22} />
          </MapButton>
        </div>
      </div>

      {/* Sheet: short on the Map tab, tall for other tabs; a sidebar on desktop. */}
      <aside
        key={tab}
        aria-label={onMap ? 'Quick help' : undefined}
        className={`slide-up absolute inset-x-0 bottom-0 z-[1001] flex flex-col rounded-t-sheet bg-white px-4 pt-2.5 pb-[calc(104px+env(safe-area-inset-bottom))] shadow-sheet lg:top-0 lg:left-auto lg:w-[400px] lg:rounded-none lg:px-5 lg:pt-6 lg:border-l lg:border-line lg:shadow-none ${
          onMap ? '' : 'top-[150px]'
        }`}
      >
        <Handle />
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {tab === 'map' && <MapTab onHelp={() => setTab('help')} />}
          {tab === 'alerts' && <AlertsTab onClose={backToMap} />}
          {tab === 'help' && <HelpTab onClose={backToMap} />}
          {tab === 'ngos' && <NgosTab onClose={backToMap} />}
        </div>
      </aside>

      <div className="pointer-events-none absolute inset-x-3.5 bottom-[max(14px,env(safe-area-inset-bottom))] z-[1002] lg:left-auto lg:w-[372px]">
        <BottomNav current={tab} onChange={setTab} />
      </div>
    </div>
  );
}

/** Map tab sheet: kept short so the map stays visible. */
function MapTab({ onHelp }: { onHelp: () => void }) {
  return (
    <>
      <div className="mb-5 hidden lg:block">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Northeast Connect</h2>
        <p className="mt-0.5 text-[13.5px] font-semibold text-muted">Early warnings for the 8 North East states.</p>
      </div>
      <GetHelpButton onClick={onHelp} />
    </>
  );
}

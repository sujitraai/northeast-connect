import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import L, { type Map as LeafletMap } from 'leaflet';
import MapView from './components/MapView';
import MapButton from './components/MapButton';
import TopCard, { CardAction } from './components/TopCard';
import BottomNav, { type TabId } from './components/BottomNav';
import { Handle } from './components/sheet';
import MapSheet, { type TypeFilter } from './components/MapSheet';
import type { MapSelection } from './components/map/ZoneLayers';
import TurnOnAlerts from './components/TurnOnAlerts';
import WarningBanner from './components/alerts/WarningBanner';
import EarlySheet from './components/alerts/EarlySheet';
import DangerTakeover from './components/alerts/DangerTakeover';
import EarlyFlash from './components/alerts/EarlyFlash';
import FamilyPanel from './components/tabs/FamilyPanel';
import type { MapRoute } from './components/map/RouteLayer';
import AlertsTab from './components/tabs/AlertsTab';
import DistrictPicker from './components/tabs/DistrictPicker';
import HelpTab from './components/tabs/HelpTab';
import NgosTab from './components/tabs/NgosTab';
import { Icon, Spinner } from './components/icons';
import type { BaseMapId } from './config/basemaps';
import { NE_BOUNDS } from './config/region';
import { useAlertSetup } from './hooks/useAlertSetup';
import { useChosenDistrict } from './hooks/useChosenDistrict';
import { useDemoLocation } from './hooks/useDemoLocation';
import { useGeoData } from './hooks/useGeoData';
import { useGeolocation } from './hooks/useGeolocation';
import { useLiveMap } from './hooks/useLiveMap';
import { useAlarm } from './hooks/useAlarm';
import { useNow } from './hooks/useNow';
import { locatePlace, type DistrictProps, type PlaceMatch } from './lib/region';
import { assess, atLeast, centreOf, type Here } from './lib/safety';
import { GUIDANCE } from './lib/guidance';
import { safeShelter } from './lib/shelters';
import { formatEta, isSimulating, withCurrentRadius } from './lib/simulation';
import { topCardFor } from './lib/topCard';

const BASEMAP_KEY = 'nec.basemap';

function loadBaseMap(): BaseMapId {
  try {
    if (localStorage.getItem(BASEMAP_KEY) === 'satellite') return 'satellite';
  } catch {
    /* storage unavailable */
  }
  return 'streets';
}

/** What the sheet shows: a nav tab, the district list, or Alert family. */
type Panel = TabId | 'district' | 'family';

export default function App() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [baseMap, setBaseMap] = useState<BaseMapId>(loadBaseMap);
  const [panel, setPanel] = useState<Panel>('map');
  const [tappedDistrict, setTappedDistrict] = useState<DistrictProps | null>(null);
  // undefined = not located yet; null = located, but outside North East India.
  const [userPlace, setUserPlace] = useState<PlaceMatch | null | undefined>(undefined);
  const [selection, setSelection] = useState<MapSelection>(null);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [setupOpen, setSetupOpen] = useState(false);
  const [routeOn, setRouteOn] = useState(false);
  // The Danger screen was closed for this disaster ("Show map").
  const [dangerClosedFor, setDangerClosedFor] = useState<string | null>(null);

  const geo = useGeoData();
  const live = useLiveMap();
  const alerts = useAlertSetup();
  const { chosen, choose } = useChosenDistrict();
  const demo = useDemoLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const { status, position, error: locateError, denied, locate } = useGeolocation();
  const locationDenied = denied || alerts.location === 'denied';

  const toggleBaseMap = () => {
    const next: BaseMapId = baseMap === 'satellite' ? 'streets' : 'satellite';
    setBaseMap(next);
    try {
      localStorage.setItem(BASEMAP_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };

  // Returning visitors who allowed location: find them straight away.
  const canAutoLocate = alerts.choice === 'on' && alerts.location === 'granted';
  useEffect(() => {
    if (canAutoLocate) locate();
  }, [canAutoLocate, locate]);

  // Location refused and no district (or demo location) yet: offer the district list.
  const hasDemo = demo.demo !== null;
  useEffect(() => {
    if (locationDenied && !chosen && !hasDemo) setPanel('district');
  }, [locationDenied, chosen, hasDemo]);

  // Short message at the top (e.g. long-press outside the region).
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // When a GPS fix arrives (and the state shapes are loaded), work out where
  // the user is and move the map. Runs once per fix.
  useEffect(() => {
    if (!position || !geo.states || !map) return;
    const place = locatePlace(position.lat, position.lng, geo.states, geo.districts);
    setUserPlace(place);
    setTappedDistrict(null);
    if (hasDemo) return; // a demo location is in use: keep the map where it is
    if (place) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 11), { duration: 1.2 });
    } else {
      map.flyToBounds(NE_BOUNDS, { duration: 1 });
    }
    // geo.districts deliberately omitted: a late district load shouldn't re-fly the map.
    // hasDemo read at fix time only.
  }, [position, geo.states, map]);

  // Where the person is: GPS wins; otherwise the district they picked.
  const chosenShape = useMemo(
    () => (chosen ? geo.districts?.features.find((f) => f.properties.district === chosen.district && f.properties.state === chosen.state) : undefined),
    [chosen, geo.districts],
  );
  const inRegion = Boolean(userPlace) && status === 'found' && position !== null;
  // Where the person is: demo location (long-press) wins, then GPS, then the chosen district.
  const demoPlace = useMemo(
    () => (demo.demo && geo.states ? locatePlace(demo.demo.lat, demo.demo.lng, geo.states, geo.districts) : null),
    [demo.demo, geo.states, geo.districts],
  );
  let here: Here | null = null;
  if (demo.demo && demoPlace) {
    here = { kind: 'gps', at: demo.demo, district: demoPlace.district, state: demoPlace.state, demo: true };
  } else if (inRegion && position && userPlace) {
    here = { kind: 'gps', at: position, district: userPlace.district, state: userPlace.state };
  } else if (chosen && chosenShape) {
    here = { kind: 'district', at: centreOf(chosenShape), district: chosen.district, state: chosen.state, shape: chosenShape };
  }

  // A running simulation grows its area: re-check every second, using the radius "now".
  const now = useNow(live.disasters.some(isSimulating));
  const nowDisasters = useMemo(() => live.disasters.map((d) => withCurrentRadius(d, now)), [live.disasters, now]);

  // How safe am I? Uses every active disaster (not the map filter). Recomputed on every live update.
  const canCheck = live.status !== 'off' && live.loaded && !(live.error && !live.updatedAt);
  const safety = here && canCheck ? assess(here, nowDisasters) : null;
  const level = safety?.level ?? 'safe';
  const lead = safety?.lead ?? null;
  const loud = atLeast(level, 'early') && lead !== null;

  // Early warning / Danger: nearest shelter outside the area, and the loud alert.
  const shelter = loud && here && lead ? safeShelter(here.at, live.shelters, lead.disaster) : null;
  const g = lead ? GUIDANCE[lead.disaster.type] : null;
  const eta = lead?.etaHours != null ? formatEta(lead.etaHours) : null;
  const siren = useAlarm({
    level,
    title: level === 'danger' ? `${g?.name ?? 'Disaster'} danger: ${g?.instruction ?? 'move to safety'}` : `Early warning: ${g?.name ?? 'disaster'}`,
    body: lead
      ? lead.inside
        ? `You are inside the ${lead.disaster.title} area. ${g?.instruction}.`
        : `${lead.disaster.title} may reach you in ${eta ?? 'soon'} (${isSimulating(lead.disaster) ? 'Simulation' : 'Estimate'}).`
      : '',
  });
  const dangerId = level === 'danger' && lead ? lead.disaster.id : null;
  const showTakeover = dangerId !== null && dangerClosedFor !== dangerId;
  useEffect(() => {
    if (!loud) setRouteOn(false);
    if (level !== 'danger') setDangerClosedFor(null);
  }, [loud, level]);
  const route: MapRoute | null =
    loud && shelter ? { from: here?.kind === 'gps' ? here.at : null, to: shelter.shelter, line: routeOn } : null;

  const pickDistrict = (district: string, state: string) => {
    choose({ district, state });
    setPanel('map');
    const shape = geo.districts?.features.find((f) => f.properties.district === district && f.properties.state === state);
    if (shape && map) map.flyToBounds(L.geoJSON(shape).getBounds(), { duration: 1, padding: [24, 24] });
  };

  // Tapping a district clears a selected zone, and the other way round.
  const onSelectDistrict = useCallback((d: DistrictProps | null) => {
    setTappedDistrict(d);
    setSelection(null);
  }, []);
  const onSelectItem = useCallback((s: MapSelection) => {
    setSelection(s);
    setTappedDistrict(null);
    if (s) setPanel('map');
  }, []);
  const onMapReady = useCallback((m: LeafletMap) => setMap(m), []);
  const setDemo = demo.set;
  const onLongPress = useCallback(
    (lat: number, lng: number) => {
      if (!geo.states || !locatePlace(lat, lng, geo.states, null)) {
        setNotice('Long-press inside North East India to set a demo location.');
        return;
      }
      setDemo(lat, lng);
      setTappedDistrict(null);
      setSelection(null);
      setPanel('map');
    },
    [geo.states, setDemo],
  );

  // Filter chips apply to both disasters and risk areas.
  const disasters = nowDisasters.filter((d) => filter === 'all' || d.type === filter);
  const riskZones = live.riskZones.filter((z) => filter === 'all' || z.type === filter);
  // Looked up from live data, so a deleted or hidden item closes its card.
  const selectedDisaster = selection?.kind === 'disaster' ? (disasters.find((d) => d.id === selection.id) ?? null) : null;
  const selectedRisk = selection?.kind === 'risk' ? (riskZones.find((z) => z.id === selection.id) ?? null) : null;

  const locating = status === 'locating';

  // --- Top card ---
  const top = topCardFor({
    mapFailed: Boolean(geo.error),
    tappedDistrict,
    here,
    outside: userPlace === null && status === 'found',
    locationDenied,
    locateError: status === 'error' ? locateError : null,
    live,
    safety,
  });
  const findMe = (
    <CardAction icon={locating ? <Spinner size={16} /> : <Icon name="locate" size={16} />} onClick={locate} busy={locating}>
      {locating ? 'Finding you…' : 'Find me'}
    </CardAction>
  );
  const chooseBtn = (label: string) => (
    <CardAction icon={<Icon name="pin" size={16} />} onClick={() => setPanel('district')}>
      {label}
    </CardAction>
  );
  let action: ReactNode = null;
  if (top.action === 'retry') action = <CardAction onClick={() => window.location.reload()}>Try again</CardAction>;
  else if (top.action === 'find') action = findMe;
  else if (top.action === 'choose') action = chooseBtn('Choose district');
  else if (top.action === 'find-or-choose') {
    action = (
      <div className="flex flex-wrap gap-2">
        {!locationDenied && findMe}
        {chooseBtn('Choose district')}
      </div>
    );
  } else if (here?.kind === 'district' && !tappedDistrict) action = chooseBtn('Change district');

  // --- Alerts setup ---
  const showSetup = alerts.choice === null || setupOpen;
  const notifOff = alerts.notif === 'denied' || alerts.notif === 'default';
  // Sound unlocks on any tap, so "off" means: alerts skipped, or notifications not allowed.
  // (Refusing location alone no longer turns alerts off: a district or demo location still works.)
  const alertsOff = alerts.choice !== null && (alerts.choice === 'skipped' || notifOff);
  const blocked = [locationDenied && 'location', alerts.notif === 'denied' && 'notifications'].filter(Boolean).join(' and ');
  const blockedNote = blocked
    ? `Your browser has blocked ${blocked} for this site. Tap the lock or ⓘ next to the web address, allow ${blocked}, then tap “Turn on alerts” again.`
    : null;

  const tab: TabId = panel === 'district' || panel === 'family' ? 'map' : panel;
  const onMap = panel === 'map';
  const backToMap = () => setPanel('map');

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {/* Map: full screen on phones, everything left of the sidebar on desktop. */}
      <div className="absolute inset-0 lg:right-[400px]">
        <MapView
          baseMap={baseMap}
          geo={geo}
          userPosition={here?.kind === 'gps' ? (here.demo ? { ...here.at, accuracy: 0 } : position) : null}
          selectedDistrict={tappedDistrict}
          onSelectDistrict={onSelectDistrict}
          onMapReady={onMapReady}
          disasters={disasters}
          riskZones={riskZones}
          selected={selection}
          onSelectItem={onSelectItem}
          route={route}
          onLongPress={onLongPress}
        />
      </div>

      {/* Alerts pill + top card + right rail. Hidden on phones while a tall sheet is open. */}
      <div
        className={`pointer-events-none absolute inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-[1000] flex flex-col gap-3 lg:right-[412px] ${
          onMap ? '' : 'max-lg:hidden'
        }`}
      >
        <div className="flex flex-col gap-2 lg:max-w-[400px]">
          {(demo.demo || notice) && (
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {demo.demo && (
                <button
                  type="button"
                  onClick={demo.clear}
                  className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-navy px-3.5 text-[13px] font-bold text-white shadow-soft"
                >
                  <Icon name="pin" size={15} />
                  Demo location · <span className="text-[#AFC3FF]">tap to clear</span>
                </button>
              )}
              {notice && (
                <span role="status" className="inline-flex min-h-9 items-center rounded-full bg-white/95 px-3.5 text-[13px] font-bold text-ink-2 shadow-soft">
                  {notice}
                </span>
              )}
            </div>
          )}
          {loud && lead && (level === 'early' || !showTakeover) ? (
            <WarningBanner
              level={level === 'danger' ? 'danger' : 'early'}
              lead={lead}
              siren={siren}
              onOpen={level === 'danger' ? () => setDangerClosedFor(null) : undefined}
            />
          ) : (
            <>
              {alertsOff && (
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="pointer-events-auto inline-flex h-9 items-center gap-1.5 self-center rounded-full bg-white/95 px-3.5 text-[13px] font-bold text-ink-2 shadow-soft lg:self-start"
                >
                  <Icon name="bell" size={15} />
                  Alerts are off · <span className="text-primary">Turn on</span>
                </button>
              )}
              <TopCard {...top.card} action={action} onClose={top.closable ? () => setTappedDistrict(null) : undefined} />
            </>
          )}
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

      {/* Sheet: short on the Map tab, tall for other panels; a sidebar on desktop. */}
      <aside
        key={panel}
        aria-label={onMap ? 'Your safety' : undefined}
        className={`slide-up absolute inset-x-0 bottom-0 z-[1001] flex flex-col rounded-t-sheet bg-white px-4 pt-2.5 pb-[calc(104px+env(safe-area-inset-bottom))] shadow-sheet lg:top-0 lg:left-auto lg:w-[400px] lg:rounded-none lg:border-l lg:border-line lg:px-5 lg:pt-6 lg:shadow-none ${
          onMap ? '' : 'top-[150px]'
        }`}
      >
        <Handle />
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {panel === 'map' && loud && lead && (
            <EarlySheet
              lead={lead}
              pick={shelter}
              from={here?.kind === 'gps' ? here.at : null}
              routeOn={routeOn}
              onRoute={() => setRouteOn((v) => !v)}
              onFamily={() => setPanel('family')}
            />
          )}
          {panel === 'map' && !loud && (
            <MapSheet
              live={live}
              shownDisasters={disasters.length}
              shownRiskZones={riskZones.length}
              filter={filter}
              onFilter={setFilter}
              selectedDisaster={selectedDisaster}
              selectedRisk={selectedRisk}
              onCloseSelected={() => setSelection(null)}
              onHelp={() => setPanel('help')}
              safety={safety}
              here={here}
            />
          )}
          {panel === 'district' && (
            <DistrictPicker districts={geo.districts} current={chosen} onPick={pickDistrict} onClose={backToMap} />
          )}
          {panel === 'family' && <FamilyPanel onClose={backToMap} />}
          {panel === 'alerts' && <AlertsTab onClose={backToMap} />}
          {panel === 'help' && <HelpTab onClose={backToMap} />}
          {panel === 'ngos' && <NgosTab onClose={backToMap} />}
        </div>
      </aside>

      <div className="pointer-events-none absolute inset-x-3.5 bottom-[max(14px,env(safe-area-inset-bottom))] z-[1002] lg:left-auto lg:w-[372px]">
        <BottomNav current={tab} onChange={setPanel} />
      </div>

      {siren.flash && level === 'early' && lead && <EarlyFlash lead={lead} onDismiss={siren.dismissFlash} />}

      {showTakeover && lead && (
        <DangerTakeover
          lead={lead}
          pick={shelter}
          from={here?.kind === 'gps' ? here.at : null}
          siren={siren}
          onFamily={() => {
            setDangerClosedFor(lead.disaster.id);
            setPanel('family');
          }}
          onClose={() => setDangerClosedFor(lead.disaster.id)}
        />
      )}

      {showSetup && (
        <TurnOnAlerts
          blockedNote={alerts.choice !== null ? blockedNote : null}
          onTurnOn={() => {
            void alerts.turnOn(locate);
            setSetupOpen(false);
          }}
          onSkip={() => {
            alerts.skip();
            setSetupOpen(false);
          }}
        />
      )}
    </div>
  );
}

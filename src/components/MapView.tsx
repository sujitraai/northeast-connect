import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Pane,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L, { type Layer, type Map as LeafletMap, type PathOptions } from 'leaflet';
import type { Feature } from 'geojson';
import { BASE_MAPS, MAP_STYLES, type BaseMapId } from '../config/basemaps';
import { MAX_BOUNDS, MAX_ZOOM, NE_BOUNDS, STATE_LABELS } from '../config/region';
import type { GeoData } from '../hooks/useGeoData';
import type { Position } from '../hooks/useGeolocation';
import type { DistrictProps } from '../lib/region';
import type { Disaster, RiskZone } from '../lib/database.types';
import ZoneLayers, { type MapSelection } from './map/ZoneLayers';

const BOUNDARY_ATTR =
  'Boundaries: <a href="https://github.com/datameet/maps">DataMeet</a> (districts: Census 2011)';

const DISTRICT_SELECTED: PathOptions = {
  color: '#2F5BEA',
  weight: 3,
  opacity: 1,
  dashArray: undefined,
  fillColor: '#2F5BEA',
  fillOpacity: 0.1,
};

interface Props {
  baseMap: BaseMapId;
  geo: GeoData;
  userPosition: Position | null;
  selectedDistrict: DistrictProps | null;
  onSelectDistrict: (d: DistrictProps | null) => void;
  onMapReady: (map: LeafletMap) => void;
  disasters: Disaster[];
  riskZones: RiskZone[];
  selected: MapSelection;
  onSelectItem: (s: MapSelection) => void;
}

export default function MapView({
  baseMap,
  geo,
  userPosition,
  selectedDistrict,
  onSelectDistrict,
  onMapReady,
  disasters,
  riskZones,
  selected,
  onSelectItem,
}: Props) {
  const tiles = BASE_MAPS[baseMap];
  const look = MAP_STYLES[baseMap];

  const maskStyle: PathOptions = { stroke: false, fillColor: look.mask, fillOpacity: look.maskOpacity, interactive: false };
  const stateStyle: PathOptions = { color: look.state, weight: 2.5, opacity: 0.9, fill: false, interactive: false };

  return (
    <MapContainer
      ref={(m) => {
        if (m) onMapReady(m);
      }}
      bounds={NE_BOUNDS}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={1}
      maxZoom={MAX_ZOOM}
      zoomSnap={0.25}
      zoomControl={false}
      worldCopyJump={false}
      className={`h-full w-full ${baseMap === 'satellite' ? 'on-satellite' : ''}`}
    >
      <RegionLock />

      <TileLayer
        key={`${baseMap}-base`}
        url={tiles.base.url}
        attribution={tiles.base.attribution}
        maxNativeZoom={tiles.base.maxNativeZoom}
        maxZoom={MAX_ZOOM}
      />
      <TileLayer
        key={`${baseMap}-labels`}
        url={tiles.labels.url}
        attribution={`${tiles.labels.attribution} | ${BOUNDARY_ATTR}`}
        maxNativeZoom={tiles.labels.maxNativeZoom}
        maxZoom={MAX_ZOOM}
      />

      {/* Fade everything outside the 8 NE states. */}
      <Pane name="mask" style={{ zIndex: 350 }}>
        {geo.mask && <GeoJSON key={`mask-${baseMap}`} data={geo.mask} style={maskStyle} interactive={false} />}
      </Pane>

      <Pane name="districts" style={{ zIndex: 360 }}>
        {geo.districts && (
          <Districts
            data={geo.districts}
            baseMap={baseMap}
            selected={selectedDistrict}
            onSelect={onSelectDistrict}
          />
        )}
      </Pane>

      <Pane name="states" style={{ zIndex: 370, pointerEvents: 'none' }}>
        {geo.states && <GeoJSON key={`states-${baseMap}`} data={geo.states} style={stateStyle} interactive={false} />}
      </Pane>

      <ZoneLayers disasters={disasters} riskZones={riskZones} selected={selected} onSelect={onSelectItem} />

      <StateLabels />

      {userPosition && <UserMarker position={userPosition} />}
    </MapContainer>
  );
}

/**
 * Keeps the user inside North East India: the minimum zoom is the level at
 * which the whole region fits the screen, recalculated when the screen
 * size changes (e.g. phone rotation).
 */
function RegionLock() {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const fitZoom = map.getBoundsZoom(NE_BOUNDS, false);
      map.setMinZoom(fitZoom);
    };
    update();
    map.on('resize', update);
    return () => {
      map.off('resize', update);
    };
  }, [map]);
  return null;
}

function Districts({
  data,
  baseMap,
  selected,
  onSelect,
}: {
  data: NonNullable<GeoData['districts']>;
  baseMap: BaseMapId;
  selected: DistrictProps | null;
  onSelect: (d: DistrictProps | null) => void;
}) {
  // Keep latest callback without re-binding every feature's handlers.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const look = MAP_STYLES[baseMap];
  const normal: PathOptions = {
    color: look.district,
    weight: 1,
    opacity: look.districtOpacity,
    dashArray: '3 4',
    fillColor: '#2F5BEA',
    fillOpacity: 0,
  };

  const isSelected = (p: DistrictProps) =>
    selected !== null && p.district === selected.district && p.state === selected.state;

  const style = (f?: Feature) => (f && isSelected(f.properties as DistrictProps) ? DISTRICT_SELECTED : normal);

  const onEachFeature = (feature: Feature, layer: Layer) => {
    layer.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      onSelectRef.current(feature.properties as DistrictProps);
    });
  };

  // Clicking empty map (outside a district) clears the selection.
  useMapEvents({ click: () => onSelectRef.current(null) });

  return (
    <GeoJSON
      // Re-style when the selection or base map changes.
      key={`${baseMap}:${selected ? `${selected.state}/${selected.district}` : 'none'}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

function StateLabels() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const icons = useMemo(
    () =>
      STATE_LABELS.map((s) =>
        L.divIcon({
          className: 'state-label',
          html: `<span>${s.name}</span>`,
          iconSize: [0, 0],
        }),
      ),
    [],
  );

  // Hide once zoomed into town level; base-map place labels take over.
  if (zoom > 9) return null;
  return (
    <>
      {STATE_LABELS.map((s, i) => (
        <Marker key={s.name} position={s.at} icon={icons[i]} interactive={false} keyboard={false} />
      ))}
    </>
  );
}

/** Blue dot with a soft halo, as in the reference. */
function UserMarker({ position }: { position: Position }) {
  const center: [number, number] = [position.lat, position.lng];
  return (
    <>
      <Circle
        center={center}
        radius={position.accuracy}
        pathOptions={{ color: '#2F5BEA', weight: 1, opacity: 0.4, fillColor: '#2F5BEA', fillOpacity: 0.12 }}
        interactive={false}
      />
      <CircleMarker
        center={center}
        radius={18}
        pathOptions={{ stroke: false, fillColor: '#2F5BEA', fillOpacity: 0.15 }}
        interactive={false}
      />
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{ color: '#ffffff', weight: 4, fillColor: '#2F5BEA', fillOpacity: 1 }}
        interactive={false}
      />
    </>
  );
}

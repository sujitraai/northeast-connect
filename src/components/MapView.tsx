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
import { BASE_MAPS, type BaseMapId } from '../config/basemaps';
import { MAX_BOUNDS, MAX_ZOOM, NE_BOUNDS, STATE_LABELS } from '../config/region';
import type { GeoData } from '../hooks/useGeoData';
import type { Position } from '../hooks/useGeolocation';
import type { DistrictProps } from '../lib/region';

const BOUNDARY_ATTR =
  'Boundaries: <a href="https://github.com/datameet/maps">DataMeet</a> (districts: Census 2011)';

const MASK_STYLE: PathOptions = {
  stroke: false,
  fillColor: '#05070a',
  fillOpacity: 0.72,
  interactive: false,
};

const STATE_STYLE: PathOptions = {
  color: '#38bdf8',
  weight: 2.5,
  opacity: 0.95,
  fill: false,
  interactive: false,
};

const DISTRICT_STYLE: PathOptions = {
  color: '#e2e8f0',
  weight: 1,
  opacity: 0.45,
  dashArray: '3 4',
  fillColor: '#38bdf8',
  fillOpacity: 0,
};

const DISTRICT_SELECTED: PathOptions = {
  color: '#fbbf24',
  weight: 2.5,
  opacity: 1,
  dashArray: undefined,
  fillColor: '#fbbf24',
  fillOpacity: 0.12,
};

interface Props {
  baseMap: BaseMapId;
  geo: GeoData;
  userPosition: Position | null;
  selectedDistrict: DistrictProps | null;
  onSelectDistrict: (d: DistrictProps | null) => void;
  onMapReady: (map: LeafletMap) => void;
}

export default function MapView({
  baseMap,
  geo,
  userPosition,
  selectedDistrict,
  onSelectDistrict,
  onMapReady,
}: Props) {
  const tiles = BASE_MAPS[baseMap];

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
      className="h-full w-full"
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

      {/* Dim everything outside the 8 NE states. */}
      <Pane name="mask" style={{ zIndex: 350 }}>
        {geo.mask && <GeoJSON data={geo.mask} style={MASK_STYLE} interactive={false} />}
      </Pane>

      <Pane name="districts" style={{ zIndex: 360 }}>
        {geo.districts && (
          <Districts
            data={geo.districts}
            selected={selectedDistrict}
            onSelect={onSelectDistrict}
          />
        )}
      </Pane>

      <Pane name="states" style={{ zIndex: 370, pointerEvents: 'none' }}>
        {geo.states && <GeoJSON data={geo.states} style={STATE_STYLE} interactive={false} />}
      </Pane>

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
  selected,
  onSelect,
}: {
  data: NonNullable<GeoData['districts']>;
  selected: DistrictProps | null;
  onSelect: (d: DistrictProps | null) => void;
}) {
  // Keep latest callback without re-binding every feature's handlers.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const isSelected = (p: DistrictProps) =>
    selected !== null && p.district === selected.district && p.state === selected.state;

  const style = (f?: Feature) =>
    f && isSelected(f.properties as DistrictProps) ? DISTRICT_SELECTED : DISTRICT_STYLE;

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
      // Re-style when the selection changes.
      key={selected ? `${selected.state}/${selected.district}` : 'none'}
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

function UserMarker({ position }: { position: Position }) {
  const center: [number, number] = [position.lat, position.lng];
  return (
    <>
      <Circle
        center={center}
        radius={position.accuracy}
        pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.12 }}
        interactive={false}
      />
      <CircleMarker
        center={center}
        radius={9}
        pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }}
        interactive={false}
      />
    </>
  );
}

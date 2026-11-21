import { useEffect, useRef, useState } from 'react';
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  Pane,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import L, { type PathOptions } from 'leaflet';
import { Icon } from '../../components/icons';
import { BASE_MAPS, MAP_STYLES } from '../../config/basemaps';
import { MAX_BOUNDS, MAX_ZOOM, NE_BOUNDS } from '../../config/region';
import type { GeoData } from '../../hooks/useGeoData';
import { locatePlace, type PlaceMatch } from '../../lib/region';

export interface PickedPoint {
  lat: number;
  lng: number;
}

interface Props {
  geo: GeoData;
  value: PickedPoint | null;
  onChange: (p: PickedPoint, place: PlaceMatch) => void;
  /** Draws the affected area around the point. */
  radiusKm?: number;
  color?: string;
}

const LOOK = MAP_STYLES.streets;
const MASK: PathOptions = { stroke: false, fillColor: LOOK.mask, fillOpacity: LOOK.maskOpacity, interactive: false };
const STATES: PathOptions = { color: LOOK.state, weight: 2, opacity: 0.8, fill: false, interactive: false };
const DISTRICTS: PathOptions = {
  color: LOOK.district,
  weight: 1,
  opacity: LOOK.districtOpacity,
  dashArray: '3 4',
  fill: false,
  interactive: false,
};

/** Map for choosing a location inside North East India. Tap to place the point. */
export default function PointPicker({ geo, value, onChange, radiusKm, color = '#2F5BEA' }: Props) {
  const [outside, setOutside] = useState(false);
  const tiles = BASE_MAPS.streets;

  return (
    <div>
      <div className="relative isolate h-80 overflow-hidden rounded-[18px] lg:h-[468px]">
        <MapContainer
          bounds={NE_BOUNDS}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={1}
          maxZoom={MAX_ZOOM}
          minZoom={5}
          zoomSnap={0.5}
          scrollWheelZoom={false}
          zoomControl={false}
          className="h-full w-full cursor-crosshair"
        >
          <ZoomControl position="bottomright" />
          <TileLayer url={tiles.base.url} attribution={tiles.base.attribution} maxNativeZoom={tiles.base.maxNativeZoom} maxZoom={MAX_ZOOM} />
          <TileLayer url={tiles.labels.url} attribution={tiles.labels.attribution} maxNativeZoom={tiles.labels.maxNativeZoom} maxZoom={MAX_ZOOM} />
          <Pane name="pick-mask" style={{ zIndex: 350, pointerEvents: 'none' }}>
            {geo.mask && <GeoJSON data={geo.mask} style={MASK} interactive={false} />}
          </Pane>
          <Pane name="pick-lines" style={{ zIndex: 360, pointerEvents: 'none' }}>
            {geo.districts && <GeoJSON data={geo.districts} style={DISTRICTS} interactive={false} />}
            {geo.states && <GeoJSON data={geo.states} style={STATES} interactive={false} />}
          </Pane>

          <ClickToPick
            geo={geo}
            onPick={(p, place) => {
              setOutside(!place);
              if (place) onChange(p, place);
            }}
          />
          <FitOnce value={value} radiusKm={radiusKm} />

          {value && radiusKm !== undefined && radiusKm > 0 && (
            <Circle
              center={[value.lat, value.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.16,
                dashArray: '7 6',
                className: 'zone-pulse',
              }}
              interactive={false}
            />
          )}
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={8}
              pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}
              interactive={false}
            />
          )}
        </MapContainer>

        <div className="pointer-events-none absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-[12.5px] font-bold text-ink shadow-soft">
          <Icon name="pin" size={15} />
          {value ? 'Tap the map to move the point' : 'Tap the map to set the location'}
        </div>
      </div>

      {outside && (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          That point is outside North East India. Tap inside one of the 8 states.
        </p>
      )}
    </div>
  );
}

function ClickToPick({
  geo,
  onPick,
}: {
  geo: GeoData;
  onPick: (p: PickedPoint, place: PlaceMatch | null) => void;
}) {
  useMapEvents({
    click(e) {
      if (!geo.states) return; // boundaries still loading
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));
      onPick({ lat, lng }, locatePlace(lat, lng, geo.states, geo.districts));
    },
  });
  return null;
}

/** When editing, zoom to the saved point once, on open (not on every tap). */
function FitOnce({ value, radiusKm }: { value: PickedPoint | null; radiusKm?: number }) {
  const map = useMap();
  const initial = useRef({ value, radiusKm });
  useEffect(() => {
    const { value: v, radiusKm: r } = initial.current;
    if (!v) return;
    const km = Math.max(r ?? 0, 8);
    map.fitBounds(L.latLng(v.lat, v.lng).toBounds(km * 2000 * 1.6), { animate: false });
  }, [map]);
  return null;
}

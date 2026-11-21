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
} from 'react-leaflet';
import L, { type PathOptions } from 'leaflet';
import { BASE_MAPS } from '../../config/basemaps';
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

const MASK: PathOptions = { stroke: false, fillColor: '#05070a', fillOpacity: 0.7, interactive: false };
const STATES: PathOptions = { color: '#38bdf8', weight: 2, opacity: 0.9, fill: false, interactive: false };
const DISTRICTS: PathOptions = {
  color: '#e2e8f0',
  weight: 1,
  opacity: 0.35,
  dashArray: '3 4',
  fill: false,
  interactive: false,
};

/** Map for choosing a location inside North East India. Tap to place the point. */
export default function PointPicker({ geo, value, onChange, radiusKm, color = '#38bdf8' }: Props) {
  const [outside, setOutside] = useState(false);
  const tiles = BASE_MAPS.satellite;

  return (
    <div>
      <div className="relative isolate h-72 overflow-hidden rounded-xl border border-white/15 sm:h-96">
        <MapContainer
          bounds={NE_BOUNDS}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={1}
          maxZoom={MAX_ZOOM}
          minZoom={5}
          zoomSnap={0.5}
          scrollWheelZoom={false}
          className="h-full w-full cursor-crosshair"
        >
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
                fillOpacity: 0.18,
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

        {!value && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
            <span className="rounded-full bg-slate-950/85 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              Tap the map to set the location
            </span>
          </div>
        )}
      </div>

      {outside && (
        <p role="alert" className="mt-2 text-sm font-semibold text-amber-300">
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

import { useEffect, useMemo } from 'react';
import { Marker, Pane, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng } from '../../lib/safety';

export interface MapRoute {
  /** Where the person is (null in district mode: pin only, no line). */
  from: LatLng | null;
  to: LatLng;
  /** Draw the dotted line ("Start route"). */
  line: boolean;
}

// Green teardrop pin with a house, as in the reference.
const PIN = L.divIcon({
  className: '',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  html: `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 23 15 23s15-12 15-23C30 6.7 23.3 0 15 0z" fill="#16A34A" stroke="#fff" stroke-width="2.5"/><path d="M9 16.5 15 11l6 5.5V22H9z" fill="#fff"/></svg>`,
});

/** Shelter pin, plus a dotted navy line from the person to it after "Start route". */
export default function RouteLayer({ route }: { route: MapRoute }) {
  const map = useMap();
  const points = useMemo<[number, number][]>(
    () => (route.from ? [[route.from.lat, route.from.lng], [route.to.lat, route.to.lng]] : []),
    [route.from, route.to],
  );

  // Show both ends when the route starts.
  useEffect(() => {
    if (route.line && points.length === 2) map.flyToBounds(points, { padding: [70, 70], duration: 1, maxZoom: 15 });
    // Only when the line is switched on, not on every position update.
  }, [route.line, map]);

  return (
    <Pane name="route" style={{ zIndex: 395 }}>
      {route.line && points.length === 2 && (
        <>
          <Polyline positions={points} pathOptions={{ color: '#fff', weight: 10, opacity: 0.9, lineCap: 'round' }} interactive={false} />
          <Polyline
            positions={points}
            pathOptions={{ color: '#0F1B3D', weight: 5, dashArray: '1 10', lineCap: 'round' }}
            interactive={false}
          />
        </>
      )}
      <Marker position={[route.to.lat, route.to.lng]} icon={PIN} interactive={false} keyboard={false} />
    </Pane>
  );
}

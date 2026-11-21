import { Marker, Pane, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Ngo } from '../../lib/database.types';

// Blue teardrop pin with a heart, as in the reference.
const PIN = L.divIcon({
  className: '',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  tooltipAnchor: [0, -34],
  html: `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 23 15 23s15-12 15-23C30 6.7 23.3 0 15 0z" fill="#2F5BEA" stroke="#fff" stroke-width="2.5"/><path d="M15 21.5s-5.5-3.4-5.5-7.4a3 3 0 0 1 5.5-1.9 3 3 0 0 1 5.5 1.9c0 4-5.5 7.4-5.5 7.4z" fill="#fff"/></svg>`,
});

/** Blue heart pins for help groups (shown while the Help groups tab is open). */
export default function GroupPins({ groups }: { groups: Ngo[] }) {
  return (
    <Pane name="group-pins" style={{ zIndex: 640 }}>
      {groups.map((g) =>
        g.lat != null && g.lng != null ? (
          <Marker key={g.id} position={[g.lat, g.lng]} icon={PIN} keyboard={false}>
            <Tooltip direction="top">{g.name}</Tooltip>
          </Marker>
        ) : null,
      )}
    </Pane>
  );
}

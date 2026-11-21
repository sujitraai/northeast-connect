import { useRef } from 'react';
import { Circle, CircleMarker, GeoJSON, Pane } from 'react-leaflet';
import L, { type LeafletMouseEvent, type PathOptions } from 'leaflet';
import type { Disaster, RiskZone } from '../../lib/database.types';
import { severityOf, TONE_HEX } from '../../lib/labels';

export type MapSelection = { kind: 'disaster' | 'risk'; id: string } | null;

/** Risk areas are not alerts, so they don't use the status colours. */
export const RISK_COLOR = { flood: '#2F5BEA', landslide: '#8A5A2B' } as const;

interface Props {
  disasters: Disaster[];
  riskZones: RiskZone[];
  selected: MapSelection;
  onSelect: (s: MapSelection) => void;
}

/** Risk areas (under) and active disasters (over), both tappable. */
export default function ZoneLayers({ disasters, riskZones, selected, onSelect }: Props) {
  // Keep the latest callback without re-binding every layer's handlers.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const pick = (s: MapSelection) => (e: LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e); // don't also select the district underneath
    onSelectRef.current(s);
  };

  return (
    <>
      <Pane name="risk-zones" style={{ zIndex: 380 }}>
        {riskZones.map((z) => {
          const on = selected?.kind === 'risk' && selected.id === z.id;
          const color = RISK_COLOR[z.type];
          const style: PathOptions = {
            color,
            weight: on ? 3 : 1.5,
            opacity: 0.9,
            dashArray: on ? undefined : '2 5',
            fillColor: color,
            fillOpacity: z.level === 'high' ? 0.16 : 0.1,
          };
          return (
            <GeoJSON
              // Re-style when the zone changes or is (de)selected.
              key={`${z.id}:${z.updated_at}:${on}`}
              data={z.geometry}
              style={style}
              eventHandlers={{ click: pick({ kind: 'risk', id: z.id }) }}
            />
          );
        })}
      </Pane>

      <Pane name="disasters" style={{ zIndex: 390 }}>
        {disasters.map((d) => {
          const on = selected?.kind === 'disaster' && selected.id === d.id;
          const color = TONE_HEX[severityOf(d.severity).tone];
          const center: [number, number] = [d.lat, d.lng];
          const metres = Number(d.radius_km) * 1000;
          return (
            <DisasterZone key={d.id} center={center} metres={metres} color={color} on={on} onClick={pick({ kind: 'disaster', id: d.id })} />
          );
        })}
      </Pane>
    </>
  );
}

/** Dashed outer ring, pulsing core, centre dot — as in the design reference. */
function DisasterZone({
  center,
  metres,
  color,
  on,
  onClick,
}: {
  center: [number, number];
  metres: number;
  color: string;
  on: boolean;
  onClick: (e: LeafletMouseEvent) => void;
}) {
  return (
    <>
      <Circle
        center={center}
        radius={metres}
        pathOptions={{
          color,
          weight: on ? 4 : 2.5,
          dashArray: on ? undefined : '7 6',
          fillColor: color,
          fillOpacity: 0.16,
        }}
        eventHandlers={{ click: onClick }}
      />
      <Circle
        center={center}
        radius={metres * 0.55}
        pathOptions={{ stroke: false, fillColor: color, fillOpacity: 0.22, className: 'zone-pulse' }}
        interactive={false}
      />
      <CircleMarker
        center={center}
        radius={7}
        pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}
        eventHandlers={{ click: onClick }}
      />
    </>
  );
}

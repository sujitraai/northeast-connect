import type { Disaster } from '../../lib/database.types';
import { severityOf, timeAgo } from '../../lib/labels';
import { formatKm, type Nearest, type SafetyLevel } from '../../lib/safety';
import { isSimulating } from '../../lib/simulation';
import { DISASTER_ICON, Icon } from '../icons';
import { DemoTag } from '../lists';
import { EmptyState, SheetHead } from '../sheet';

/** Disasters within this distance count as "near you". */
export const ALERTS_KM = 100;

const LEVEL: Record<SafetyLevel, { word: string; pill: string; tile: string }> = {
  danger: { word: 'Danger', pill: 'bg-danger-soft text-danger', tile: 'bg-danger-soft text-danger' },
  early: { word: 'Early warning', pill: 'bg-warn-soft text-warn', tile: 'bg-warn-soft text-warn' },
  watch: { word: 'Watch', pill: 'bg-watch-soft text-watch', tile: 'bg-watch-soft text-watch' },
  safe: { word: 'Far away', pill: 'bg-chip text-muted', tile: 'bg-chip text-muted' },
};

export interface AlertItem {
  disaster: Disaster;
  /** null when we don't know where the person is. */
  threat: Nearest | null;
}

interface Props {
  items: AlertItem[];
  located: boolean;
  onOpen: (d: Disaster) => void;
  onClose: () => void;
}

/** Alerts tab: active disasters near the person, nearest first. Tap one to see it on the map. */
export default function AlertsTab({ items, located, onOpen, onClose }: Props) {
  return (
    <>
      <SheetHead
        title="Alerts"
        sub={located ? `Active disasters within ${ALERTS_KM} km, nearest first.` : 'All active disasters. Set your location to see distances.'}
        onClose={onClose}
      />
      {items.length === 0 ? (
        <EmptyState icon="bell" title={located ? `No active disasters within ${ALERTS_KM} km` : 'No active disasters'}>
          This list updates by itself when a disaster is added.
        </EmptyState>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map(({ disaster: d, threat: t }) => {
            const lvl = LEVEL[t?.level ?? 'safe'];
            const sev = severityOf(d.severity);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onOpen(d)}
                  className="flex w-full items-center gap-3 rounded-[18px] bg-bg p-2.5 text-left active:scale-[0.99]"
                >
                  <span className={`grid size-[42px] shrink-0 place-items-center rounded-[14px] ${t ? lvl.tile : sev.tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-watch-soft text-watch'}`}>
                    <Icon name={DISASTER_ICON[d.type]} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px] leading-snug font-extrabold text-ink">{d.title}</b>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-muted">
                      {t && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${lvl.pill}`}>
                          {lvl.word}
                        </span>
                      )}
                      {t && (t.inside ? 'You are inside' : `${formatKm(t.edgeKm)} ${t.direction}`)}
                      <span>· {sev.label}</span>
                      <span>· {isSimulating(d) ? 'Simulation running' : timeAgo(d.updated_at)}</span>
                      {d.is_demo && <DemoTag />}
                    </span>
                  </span>
                  <Icon name="map" size={18} className="shrink-0 text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

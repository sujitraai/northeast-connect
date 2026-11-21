import type { GroupNearby } from '../../lib/nearby';
import { kmText, telHref } from '../../lib/nearby';
import { Icon } from '../icons';

interface Props {
  /** Nearest help group (null = none nearby). */
  group: GroupNearby | null;
  /** District control room (or the national 1077 line). */
  room: { name: string; phone: string; isDemo: boolean };
  /** Open the Help groups tab (used when the group has no phone listed). */
  onGroups: () => void;
}

const ROW = 'flex min-h-[52px] w-full items-center gap-3 rounded-[16px] bg-bg px-3 py-2 text-left active:scale-[0.99]';

/** "Call nearest help group" + the district control room, on the Early warning and Danger screens. */
export default function MoreHelp({ group, room, onGroups }: Props) {
  const g = group?.item;
  const sub = g ? [g.name, Number.isFinite(group.km) ? kmText(group.km) : null, g.is_demo ? 'Demo data' : null].filter(Boolean).join(' · ') : '';
  return (
    <div className="space-y-2">
      {g &&
        (g.phone ? (
          <a href={telHref(g.phone)} className={ROW}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-safe text-white">
              <Icon name="phone" size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14.5px] font-extrabold text-ink">Call nearest help group</b>
              <span className="block truncate text-[12px] font-semibold text-muted">{sub}</span>
            </span>
          </a>
        ) : (
          // Demo groups have no phone number on purpose: show where they are instead.
          <button type="button" onClick={onGroups} className={ROW}>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white">
              <Icon name="users" size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14.5px] font-extrabold text-ink">Nearest help group</b>
              <span className="block truncate text-[12px] font-semibold text-muted">{sub} · no phone listed, see directions</span>
            </span>
          </button>
        ))}
      <a href={telHref(room.phone)} className={ROW}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-safe text-white">
          <Icon name="phone" size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[14.5px] font-extrabold text-ink">{room.name}</b>
          <span className="block text-[12px] font-semibold text-muted">
            {room.phone}
            {room.isDemo && ' · Demo data'}
          </span>
        </span>
      </a>
    </div>
  );
}

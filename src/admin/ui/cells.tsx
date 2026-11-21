import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/icons';
import { setActive } from '../lib/data';
import { DemoBadge, Switch } from './bits';

const TILE = {
  watch: 'bg-watch-soft text-watch',
  danger: 'bg-danger-soft text-danger',
  safe: 'bg-safe-soft text-safe',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-chip text-muted',
} as const;

/** Coloured icon tile + bold name (+ "Demo data" pill). First column of every table. */
export function TitleCell({
  icon,
  tone,
  title,
  sub,
  demo,
}: {
  icon: IconName;
  tone: keyof typeof TILE;
  title: string;
  sub?: ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid size-[34px] shrink-0 place-items-center rounded-[11px] ${TILE[tone]}`}>
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b className="font-extrabold text-ink">{title}</b>
          {demo && <DemoBadge />}
        </div>
        {sub && <div className="mt-0.5 text-xs font-semibold text-muted">{sub}</div>}
      </div>
    </div>
  );
}

/** The "Public" switch: shows or hides a row on the public map right away. */
export function PublicSwitch({
  table,
  id,
  active,
  onSaved,
  onError,
}: {
  table: 'disasters' | 'ngos';
  id: string;
  active: boolean;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toggle = async (v: boolean) => {
    setBusy(true);
    const err = await setActive(table, id, v);
    setBusy(false);
    if (err) onError(err);
    onSaved();
  };
  return (
    <span className="inline-flex items-center gap-2">
      <Switch checked={active} disabled={busy} onChange={(v) => void toggle(v)} label="Show on public map" />
      <span className="text-xs font-bold text-muted lg:hidden">{active ? 'Public' : 'Hidden'}</span>
    </span>
  );
}

import type { ReactNode } from 'react';
import type { Disaster, RiskZone } from '../lib/database.types';
import { severityOf, timeAgo } from '../lib/labels';
import { formatKm, type Here, type Safety } from '../lib/safety';
import type { LiveMap } from '../hooks/useLiveMap';
import { DISASTER_ICON, Icon, type IconName } from './icons';
import { RISK_COLOR } from './map/ZoneLayers';
import { GetHelpButton } from './sheet';

export type TypeFilter = 'all' | 'flood' | 'landslide' | 'earthquake';

const FILTERS: { id: TypeFilter; label: string; icon?: IconName }[] = [
  { id: 'all', label: 'All' },
  { id: 'flood', label: 'Flood', icon: 'drop' },
  { id: 'landslide', label: 'Landslide', icon: 'mountain' },
  { id: 'earthquake', label: 'Earthquake', icon: 'quake' },
];

interface Props {
  live: LiveMap;
  shownDisasters: number;
  shownRiskZones: number;
  filter: TypeFilter;
  onFilter: (f: TypeFilter) => void;
  selectedDisaster: Disaster | null;
  selectedRisk: RiskZone | null;
  onCloseSelected: () => void;
  onHelp: () => void;
  /** Set once we know where the person is and the data has loaded. */
  safety: Safety | null;
  here: Here | null;
}

/** Map tab sheet: kept short so the map stays visible. */
export default function MapSheet(p: Props) {
  return (
    <>
      <div className="mb-4 hidden lg:block">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Northeast Connect</h2>
        <p className="mt-0.5 text-[13.5px] font-semibold text-muted">Early warnings for the 8 North East states.</p>
      </div>

      {p.selectedDisaster ? (
        <DisasterCard d={p.selectedDisaster} onClose={p.onCloseSelected} />
      ) : p.selectedRisk ? (
        <RiskCard z={p.selectedRisk} onClose={p.onCloseSelected} />
      ) : p.safety && p.here ? (
        <SafetyPanel safety={p.safety} here={p.here} live={p.live} />
      ) : (
        <LiveLine live={p.live} disasters={p.shownDisasters} riskZones={p.shownRiskZones} />
      )}

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        {FILTERS.map((f) => {
          const on = f.id === p.filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => p.onFilter(f.id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-[13px] text-[13.5px] font-bold ${
                on ? 'bg-primary-soft text-primary' : 'bg-chip text-ink-2'
              }`}
            >
              {f.icon && <Icon name={f.icon} size={14} />}
              {f.label}
            </button>
          );
        })}
      </div>

      <GetHelpButton onClick={p.onHelp} />
    </>
  );
}

/** One line saying what is on the map and whether it is live. */
function LiveLine({ live, disasters, riskZones }: { live: LiveMap; disasters: number; riskZones: number }) {
  let text: ReactNode;
  if (live.status === 'off') text = 'Disaster data is not connected yet.';
  else if (!live.loaded) text = 'Loading disasters…';
  else if (live.error && !live.updatedAt) text = live.error;
  else {
    text = (
      <>
        <b className="font-extrabold text-ink">
          {disasters === 0 ? 'No active disasters' : `${disasters} active disaster${disasters === 1 ? '' : 's'}`}
        </b>
        {riskZones > 0 && `, ${riskZones} risk area${riskZones === 1 ? '' : 's'}`}
        {disasters + riskZones > 0 && '. Tap one for details.'}
      </>
    );
  }
  const anyDemo = live.disasters.some((d) => d.is_demo) || live.riskZones.some((z) => z.is_demo);

  return (
    <div className="mb-3 px-0.5">
      <p className="text-[14px] leading-snug font-semibold text-ink-2">{text}</p>
      {live.loaded && live.status !== 'off' && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {live.status === 'live' ? (
            <Pill className="bg-primary-soft text-primary">
              <i className="size-[7px] animate-pulse rounded-full bg-current" />
              Live
            </Pill>
          ) : (
            <Pill className="bg-chip text-muted">
              Not live{live.updatedAt ? `, last update ${new Date(live.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Pill>
          )}
          {anyDemo && <Pill className="bg-chip text-muted">Demo data</Pill>}
        </div>
      )}
    </div>
  );
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${className}`}>
      {children}
    </span>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close details"
      onClick={onClose}
      className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-xl text-muted active:scale-95"
    >
      <Icon name="x" size={16} />
    </button>
  );
}

const TONE_CARD = {
  watch: { card: 'bg-watch-soft', icon: 'text-watch', pill: 'bg-white text-watch', word: 'WATCH' },
  danger: { card: 'bg-danger-soft', icon: 'text-danger', pill: 'bg-white text-danger', word: 'DANGER' },
} as const;

/** Alert card for a tapped disaster zone (reference "alertcard"). */
function DisasterCard({
  d,
  onClose,
  where,
  level,
}: {
  d: Disaster;
  onClose?: () => void;
  /** Distance + direction from the person, e.g. "12 km north-east". */
  where?: string;
  /** The person's level (Watch / Danger) colours the card; severity becomes a pill. */
  level?: 'watch' | 'danger';
}) {
  const sev = severityOf(d.severity);
  const t = TONE_CARD[level ?? sev.tone];
  return (
    <article className={`slide-up mb-3 flex gap-3 rounded-inner p-3 ${t.card}`}>
      <div className={`grid size-10 shrink-0 place-items-center rounded-[14px] bg-white ${t.icon}`}>
        <Icon name={DISASTER_ICON[d.type]} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] leading-snug font-extrabold text-ink">{d.title}</h3>
          {onClose && <CloseButton onClose={onClose} />}
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
          {d.description || `Affected area: about ${Number(d.radius_km)} km around the centre.`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill className={t.pill}>
            <i className="size-[7px] rounded-full bg-current" />
            {where ? `${t.word} · ${where}` : `${t.word} · ${sev.label}`}
          </Pill>
          {where && <Pill className="bg-white/70 text-ink-2">{sev.label} severity</Pill>}
          <Pill className="bg-white/70 text-ink-2">{Number(d.radius_km)} km area</Pill>
          {d.is_demo ? <Pill className="bg-white/70 text-muted">Demo data</Pill> : d.source && <Pill className="bg-white/70 text-muted">Source: {d.source}</Pill>}
          <Pill className="bg-white/70 text-muted">{timeAgo(d.updated_at)}</Pill>
        </div>
      </div>
    </article>
  );
}

/** Card for a tapped risk area (a known flood / landslide-prone place, not an alert). */
function RiskCard({ z, onClose }: { z: RiskZone; onClose: () => void }) {
  const kind = z.type === 'flood' ? 'Flood-prone area' : 'Landslide-prone area';
  return (
    <article className="slide-up mb-3 flex gap-3 rounded-inner bg-bg p-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white" style={{ color: RISK_COLOR[z.type] }}>
        <Icon name={z.type === 'flood' ? 'drop' : 'mountain'} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] leading-snug font-extrabold text-ink">{z.name}</h3>
          <CloseButton onClose={onClose} />
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
          {kind}. This is not an alert: it marks a place where {z.type === 'flood' ? 'floods' : 'landslides'} often happen.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill className="bg-white text-ink-2">{z.level === 'high' ? 'High risk' : 'Some risk'}</Pill>
          {z.is_demo ? <Pill className="bg-white text-muted">Demo data</Pill> : z.source && <Pill className="bg-white text-muted">Source: {z.source}</Pill>}
        </div>
      </div>
    </article>
  );
}

/**
 * "How safe am I?" for Safe and Watch: two stat cards when Safe; the nearest
 * disaster's card when Watch. (Early warning / Danger use their own sheet.)
 */
function SafetyPanel({ safety, here, live }: { safety: Safety; here: Here; live: LiveMap }) {
  const n = safety.nearest;
  const of = here.kind === 'gps' ? '' : ` of ${here.district}`;

  const lead = safety.lead;
  if (lead && safety.level !== 'safe') {
    const where =
      lead.edgeKm === 0
        ? `reaches your ${here.kind === 'gps' ? 'area' : 'district'}`
        : `${formatKm(lead.edgeKm)} ${lead.direction}${of}`;
    return <DisasterCard d={lead.disaster} where={where} level={safety.level === 'watch' ? 'watch' : 'danger'} />;
  }

  const liveText =
    live.status === 'live'
      ? 'Live, updates by itself'
      : live.updatedAt
        ? `Not live, checked ${new Date(live.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
        : 'Not live';

  return (
    <div className="mb-3 grid grid-cols-2 gap-2.5">
      <Stat icon="pin" label="Nearest disaster">
        <b className="block text-[22px] font-extrabold tracking-[-0.02em] text-ink">{n ? formatKm(n.edgeKm) : 'None'}</b>
        <span className="block text-[12px] leading-snug font-semibold text-muted">
          {n ? `${n.direction[0].toUpperCase()}${n.direction.slice(1)}${of} · ${n.disaster.title}` : 'No active disasters'}
          {n?.disaster.is_demo && ' · Demo data'}
        </span>
      </Stat>
      <Stat icon="shield" label="Your risk">
        <b className="block text-[22px] font-extrabold tracking-[-0.02em] text-safe">Safe</b>
        <span className="block text-[12px] leading-snug font-semibold text-muted">{liveText}</span>
      </Stat>
    </div>
  );
}

function Stat({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-inner bg-bg px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
        <Icon name={icon} size={14} />
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

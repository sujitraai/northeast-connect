import { GUIDANCE } from '../../lib/guidance';
import type { Nearest } from '../../lib/safety';
import { formatEta, isSimulating } from '../../lib/simulation';
import { Icon } from '../icons';
import Rhino from '../Rhino';
import SirenStrip from './SirenStrip';

interface Props {
  level: 'early' | 'danger';
  lead: Nearest;
  siren: { sounding: boolean; toggle: () => void };
  /** Danger only: reopen the full red screen. */
  onOpen?: () => void;
}

/** Orange banner at the top for Early warning (reference screen 2b); red after closing the Danger screen. */
export default function WarningBanner({ level, lead, siren, onOpen }: Props) {
  const g = GUIDANCE[lead.disaster.type];
  const early = level === 'early';
  const label = isSimulating(lead.disaster) ? 'Simulation' : 'Estimate';

  const head = (
    <>
      <span className={`grid size-[58px] shrink-0 place-items-center rounded-[18px] bg-white/20 ${early ? '' : 'ring-pulse relative'}`}>
        {early ? <Rhino mood="scared" className="h-12 w-[52px]" /> : <Icon name="alert" size={30} />}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11.5px] font-extrabold tracking-[0.12em] opacity-95">
          {early ? `EARLY WARNING · ${g.name.toUpperCase()}` : `${g.name.toUpperCase()} DANGER`}
        </span>
        {lead.inside ? (
          <span className="mt-0.5 block text-[22px] leading-tight font-extrabold tracking-[-0.02em]">You are inside the area</span>
        ) : (
          <>
            <span className="mt-0.5 block text-[13px] font-bold opacity-90">{g.name} may reach you in</span>
            <span className="block text-[24px] leading-tight font-extrabold tracking-[-0.02em]">
              {lead.etaHours !== null ? formatEta(lead.etaHours) : 'soon'}
            </span>
          </>
        )}
        <span className="block text-[13px] font-bold opacity-90">
          {lead.inside ? g.instruction : `Moving towards you · ${label}`}
          {lead.disaster.is_demo && !isSimulating(lead.disaster) && ' · Demo data'}
        </span>
      </span>
      {onOpen && <Icon name="external" size={18} className="shrink-0 self-start opacity-80" />}
    </>
  );

  const headClass = `flex w-full items-center gap-3 px-3.5 py-3 text-white ${
    early ? 'bg-gradient-to-br from-[#F97316] to-warn' : 'bg-gradient-to-br from-[#EF4444] to-[#B91C1C]'
  }`;

  return (
    <section
      role="alert"
      className={`slide-up pointer-events-auto overflow-hidden rounded-card ${
        early ? 'shadow-[0_14px_30px_rgba(234,88,12,.30)]' : 'shadow-[0_14px_30px_rgba(220,38,38,.30)]'
      }`}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} className={headClass} aria-label="Open the danger screen">
          {head}
        </button>
      ) : (
        <div className={headClass}>{head}</div>
      )}
      <SirenStrip siren={siren} tone={early ? 'warn' : 'danger'} />
    </section>
  );
}

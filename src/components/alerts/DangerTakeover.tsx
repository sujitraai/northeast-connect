import { GUIDANCE } from '../../lib/guidance';
import { formatKm, type LatLng, type Nearest } from '../../lib/safety';
import { mapsLink, walkText, type ShelterPick } from '../../lib/shelters';
import { formatEta, isSimulating } from '../../lib/simulation';
import { Icon } from '../icons';
import SirenStrip from './SirenStrip';
import MoreHelp from './MoreHelp';
import type { ComponentProps } from 'react';

interface Props {
  lead: Nearest;
  pick: ShelterPick | null;
  from: LatLng | null;
  siren: { sounding: boolean; toggle: () => void };
  onFamily: () => void;
  onClose: () => void;
  help: ComponentProps<typeof MoreHelp>;
}

/** Full red Danger screen (reference screen 3). Clarity over cuteness: no mascot. */
export default function DangerTakeover({ lead, pick, from, siren, onFamily, onClose, help }: Props) {
  const g = GUIDANCE[lead.disaster.type];
  const sim = isSimulating(lead.disaster);
  const tag = sim ? 'SIMULATION · estimated arrival' : lead.etaHours !== null ? 'ESTIMATE' : lead.disaster.is_demo ? 'DEMO DATA' : null;

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="danger-title" className="fixed inset-0 z-[1900] overflow-y-auto bg-bg">
      <div className="flex min-h-full flex-col">
        <header className="bg-[radial-gradient(120%_90%_at_50%_0%,#EF4444_0%,#DC2626_45%,#B91C1C_100%)] px-[22px] pt-[max(14px,env(safe-area-inset-top))] pb-[68px] text-center text-white">
          <div className="mx-auto max-w-md">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-3.5 text-[13px] font-bold"
            >
              <Icon name="map" size={15} />
              Show map
            </button>
          </div>
          <div className="ring-pulse relative mx-auto mb-3.5 grid size-[78px] place-items-center rounded-full bg-white/20">
            <Icon name="alert" size={38} />
          </div>
          <p className="text-[12.5px] font-extrabold tracking-[0.16em] opacity-90">{g.name.toUpperCase()} DANGER</p>
          <h1 id="danger-title" className="mt-1.5 text-[28px] leading-tight font-extrabold tracking-[-0.02em]">
            {g.instruction}
          </h1>
          <p className="mt-2 text-[15px] leading-snug opacity-95">
            {lead.inside ? (
              <>
                You are inside the {g.name.toLowerCase()} area.
                <br />
                {lead.disaster.title}
              </>
            ) : (
              <>
                {g.name} may reach your area
                <br />
                in about <b>{lead.etaHours !== null ? formatEta(lead.etaHours).replace('~', '') : 'a few minutes'}</b>.
              </>
            )}
          </p>
          {tag && <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-[11.5px] font-extrabold">{tag}</span>}
          </div>
        </header>

        <div className="mx-auto -mt-12 flex w-full max-w-md flex-1 flex-col gap-2.5 px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
          <section className="overflow-hidden rounded-card bg-white shadow-soft">
            <SirenStrip siren={siren} tone="danger" />
          </section>

          <section className="rounded-card bg-white p-3.5 shadow-soft">
            <h2 className="mb-1.5 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">Do this now</h2>
            <ol>
              {g.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-3 py-[7px]">
                  <span className="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-danger-soft text-sm font-extrabold text-danger">
                    {i + 1}
                  </span>
                  <b className="text-[15px] leading-snug font-extrabold text-ink">{step}</b>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-card bg-white p-3.5 shadow-soft">
            <h2 className="mb-1.5 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">Nearest shelter</h2>
            {pick ? (
              <div className="flex items-center gap-3">
                <span className="grid size-[46px] shrink-0 place-items-center rounded-[15px] bg-safe-soft text-safe">
                  <Icon name={pick.shelter.type === 'hospital' ? 'cross' : 'tent'} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[15px] leading-snug font-extrabold text-ink">{pick.shelter.name}</b>
                  <span className="text-[12.5px] font-semibold text-muted">
                    {formatKm(pick.km)} · {walkText(pick.walkMin)}
                    {pick.shelter.is_demo && ' · Demo data'}
                  </span>
                </span>
                <a
                  href={mapsLink(from, pick.shelter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Directions to ${pick.shelter.name} in Google Maps`}
                  className="grid size-[46px] shrink-0 place-items-center rounded-full bg-primary text-white"
                >
                  <Icon name="nav" size={18} />
                </a>
              </div>
            ) : (
              <p className="text-[13.5px] font-semibold text-ink-2">No shelter is listed outside the area yet. Call 112.</p>
            )}
          </section>

          <section className="rounded-card bg-white p-3.5 shadow-soft">
            <h2 className="mb-2 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">More help</h2>
            <MoreHelp {...help} />
          </section>

          <div className="min-h-2 flex-1" />
          <a
            href="tel:112"
            className="flex h-[58px] items-center justify-center gap-2.5 rounded-[18px] bg-danger text-[17px] font-extrabold text-white shadow-[0_8px_20px_rgba(220,38,38,.28)] active:scale-[0.99]"
          >
            <Icon name="phone" size={20} />
            Call 112
          </a>
          <button
            type="button"
            onClick={onFamily}
            className="flex h-[52px] items-center justify-center gap-2 rounded-btn border-2 border-line bg-white text-[15px] font-extrabold text-ink active:scale-[0.99]"
          >
            <Icon name="check" size={18} />
            I'm safe — tell my family
          </button>
        </div>
      </div>
    </div>
  );
}

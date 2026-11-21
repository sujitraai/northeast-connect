import { useState } from 'react';
import { Icon } from '../../components/icons';
import { locatePlace } from '../../lib/region';
import { useGeo } from '../geo';
import { createDemoDisaster, planReset, resetDemo, type ResetPlan } from '../lib/demo';
import { timeAgo } from '../lib/labels';
import { useDemoPresence } from '../lib/useDemoPresence';
import type { Report } from './CrudSection';
import { GhostButton, Notice, PrimaryButton } from './bits';

const LABEL = { ngos: 'NGO', disasters: 'disaster', shelters: 'shelter', contacts: 'contact', risk_zones: 'risk area' } as const;

/** Stage tools: presets near the phone's demo location, and "Reset demo". */
export default function DemoPanel({ report }: { report: Report }) {
  const geo = useGeo();
  const demo = useDemoPresence();
  const [busy, setBusy] = useState<string | null>(null);
  const [plan, setPlan] = useState<ResetPlan | null>(null);

  const place = demo && geo.states ? locatePlace(demo.lat, demo.lng, geo.states, geo.districts) : null;

  const create = async (type: 'flood' | 'landslide') => {
    if (!demo) return;
    setBusy(type);
    const err = await createDemoDisaster(type, demo, geo.states, geo.districts);
    setBusy(null);
    report(err ?? `Demo ${type} added 8–10 km from the demo location. Press Simulate on it to start.`, err ? 'error' : 'ok');
  };

  const askReset = async () => {
    setBusy('plan');
    const p = await planReset();
    setBusy(null);
    if (typeof p === 'string') report(p);
    else setPlan(p);
  };

  const doReset = async () => {
    setBusy('reset');
    const err = await resetDemo();
    setBusy(null);
    setPlan(null);
    report(err ?? 'Demo reset. Demo items added today are deleted and every simulation is stopped.', err ? 'error' : 'ok');
  };

  const where = place ? `${place.district ? `${place.district}, ` : ''}${place.state}` : demo ? `${demo.lat.toFixed(3)}, ${demo.lng.toFixed(3)}` : '';

  return (
    <section className="mb-4 rounded-card bg-white p-4 sm:p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Icon name="zap" size={16} />
            Demo mode
          </h3>
          <p className="mt-0.5 text-[13px] font-semibold text-muted">
            {demo ? (
              <>
                Demo location: <b className="text-ink">{where}</b> · set {timeAgo(new Date(demo.at).toISOString()).toLowerCase()}
              </>
            ) : (
              'No demo location yet. On the phone, long-press the map where the “person” is.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => void create('flood')} disabled={!demo} busy={busy === 'flood'}>
            <Icon name="drop" size={16} />
            Flood near demo location
          </PrimaryButton>
          <PrimaryButton onClick={() => void create('landslide')} disabled={!demo} busy={busy === 'landslide'}>
            <Icon name="mountain" size={16} />
            Landslide near demo location
          </PrimaryButton>
          <button
            type="button"
            onClick={() => void askReset()}
            disabled={busy !== null}
            className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-danger-soft px-[18px] text-sm font-extrabold text-danger hover:bg-[#fbdada] disabled:opacity-60"
          >
            <Icon name="trash" size={16} />
            Reset demo
          </button>
        </div>
      </div>

      {plan && <ResetDialog plan={plan} busy={busy === 'reset'} onConfirm={() => void doReset()} onCancel={() => setPlan(null)} />}
    </section>
  );
}

function ResetDialog({
  plan,
  busy,
  onConfirm,
  onCancel,
}: {
  plan: ResetPlan;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const items = Object.entries(plan.counts)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${LABEL[t as keyof typeof LABEL]}${n === 1 ? '' : 's'}`);
  const nothing = items.length === 0 && plan.simulations === 0;
  return (
    <div className="fixed inset-0 z-[3000] grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="slide-up w-full max-w-md rounded-card bg-white p-5 shadow-soft">
        <h2 id="reset-title" className="text-xl font-extrabold text-ink">
          Reset the demo?
        </h2>
        <div className="mt-3 space-y-2 text-sm font-semibold text-ink-2">
          {nothing ? (
            <p>There is nothing to reset: no demo items were added today and no simulation is running.</p>
          ) : (
            <>
              {items.length > 0 && <p>This permanently deletes {items.join(', ')} added today with “Demo data” on.</p>}
              {plan.simulations > 0 && (
                <p>
                  It also stops {plan.simulations} running simulation{plan.simulations === 1 ? '' : 's'}.
                </p>
              )}
              <Notice tone="info">Seed data from earlier days and real (non-demo) items are not touched.</Notice>
            </>
          )}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <GhostButton onClick={onCancel}>{nothing ? 'Close' : 'Cancel'}</GhostButton>
          {!nothing && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-danger px-[18px] text-sm font-extrabold text-white disabled:opacity-60"
            >
              <Icon name="trash" size={16} />
              {busy ? 'Resetting…' : 'Delete and reset'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

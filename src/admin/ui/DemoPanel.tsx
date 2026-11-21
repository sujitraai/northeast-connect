import { useState } from 'react';
import { Icon } from '../../components/icons';
import { locatePlace } from '../../lib/region';
import { useGeo } from '../geo';
import { createDemoDisaster, planReset, resetDemo, type ResetPlan } from '../lib/demo';
import { timeAgo } from '../lib/labels';
import { useDemoPresence } from '../lib/useDemoPresence';
import type { Report } from './CrudSection';
import { GhostButton, Notice, PrimaryButton } from './bits';

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
    const { error, message } = await createDemoDisaster(type, demo, geo.states, geo.districts);
    setBusy(null);
    report(error ?? message, error ? 'error' : 'ok');
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
    report(err ?? 'Demo reset. Demo-button items are deleted, simulations stopped and original sizes restored.', err ? 'error' : 'ok');
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
  const made = plan.disasters.length + plan.ngos.length + plan.shelters.length;
  const nothing = made === 0 && plan.simulations === 0 && plan.radii.length === 0;
  const km = (n: number) => `${Math.round(n * 10) / 10} km`;
  return (
    <div className="fixed inset-0 z-[3000] grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="slide-up max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-card bg-white p-5 shadow-soft">
        <h2 id="reset-title" className="text-xl font-extrabold text-ink">
          Reset the demo?
        </h2>
        <div className="mt-3 space-y-3 text-sm font-semibold text-ink-2">
          {nothing ? (
            <p>Nothing to reset: no items made by the demo buttons, and no simulation has run.</p>
          ) : (
            <>
              {made > 0 && (
                <div>
                  <p>Deletes these items made by the demo buttons:</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 font-bold text-ink">
                    {plan.disasters.map((d) => (
                      <li key={d.id}>{d.title}</li>
                    ))}
                    {plan.ngos.map((n) => (
                      <li key={n.id}>{n.name} (help group)</li>
                    ))}
                    {plan.shelters.map((s) => (
                      <li key={s.id}>{s.name} (shelter)</li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.simulations > 0 && (
                <p>
                  Stops {plan.simulations} running simulation{plan.simulations === 1 ? '' : 's'}.
                </p>
              )}
              {plan.radii.length > 0 && (
                <div>
                  <p>Puts these back to their original size:</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 font-bold text-ink">
                    {plan.radii.map((r) => (
                      <li key={r.title}>
                        {r.title}: {km(r.from)} → {km(r.to)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Notice tone="info">Seed data and everything you added by hand stay as they are.</Notice>
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
              {busy ? 'Resetting…' : 'Reset demo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

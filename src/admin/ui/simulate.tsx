import { useEffect, useState } from 'react';
import { Icon, Spinner } from '../../components/icons';
import type { Disaster } from '../../lib/database.types';
import { currentRadius, isSimulating, SIM_FACTOR, speedOf } from '../../lib/simulation';
import { setSimulation } from '../lib/data';

/** Re-renders every second while `on` (for a growing radius). */
function useTick(on: boolean) {
  const [, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setT((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [on]);
}

/** Radius cell: counts up while a simulation runs. */
export function RadiusCell({ d }: { d: Disaster }) {
  const sim = isSimulating(d);
  useTick(sim);
  const r = currentRadius(d, Date.now());
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">{sim ? r.toFixed(1) : Number(d.radius_km)} km</span>
      {sim && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-extrabold text-warn">
          <i className="size-1.5 animate-pulse rounded-full bg-current" />
          Growing
        </span>
      )}
    </span>
  );
}

/** "Simulate" / "Stop" button on a disaster row. */
export function SimulateButton({ d, onDone, onError }: { d: Disaster; onDone: () => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const running = isSimulating(d);
  const speed = speedOf(d);

  const toggle = async () => {
    setBusy(true);
    const err = await setSimulation(d.id, !running);
    setBusy(false);
    if (err) onError(err);
    onDone();
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy || (!running && speed === 0)}
      title={
        running
          ? 'Stop the simulation and keep the grown area'
          : speed === 0
            ? 'Set a spread speed above 0 to simulate'
            : `Grow the area at ${speed} km/h, ${SIM_FACTOR}× faster (1 second = 1 minute)`
      }
      className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition active:scale-95 disabled:opacity-50 ${
        running ? 'bg-danger text-white' : 'bg-warn-soft text-warn'
      }`}
    >
      {busy ? <Spinner size={14} /> : <Icon name={running ? 'x' : 'zap'} size={14} />}
      {running ? 'Stop' : 'Simulate'}
    </button>
  );
}

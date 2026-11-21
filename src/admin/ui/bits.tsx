import { useEffect, useState, type ReactNode } from 'react';
import { TrashIcon } from './icons';

/** Dashed = not real. Shown on every row with is_demo = true. */
export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-slate-400/70 px-1.5 py-0.5 text-xs font-semibold text-slate-300">
      Demo data
    </span>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: 'error' | 'ok' | 'info';
  children: ReactNode;
}) {
  const cls = {
    error: 'border-red-500/60 bg-red-500/10 text-red-100',
    ok: 'border-sky-400/50 bg-sky-400/10 text-sky-100',
    info: 'border-white/15 bg-white/5 text-slate-200',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-base ${cls}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  busy,
  type = 'button',
  onClick,
  disabled,
}: {
  children: ReactNode;
  busy?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy || disabled}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 text-base font-bold text-slate-950 transition hover:bg-sky-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-base font-semibold text-slate-200 transition hover:bg-white/5"
    >
      {children}
    </button>
  );
}

/** Two-tap delete: first tap arms it, second tap (within 4 s) deletes. */
export function DeleteButton({
  onConfirm,
  label = 'Delete',
  busy,
}: {
  onConfirm: () => void;
  label?: string;
  busy?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition disabled:opacity-60 ${
        armed
          ? 'border-red-500 bg-red-600 text-white'
          : 'border-red-500/40 text-red-300 hover:bg-red-500/10'
      }`}
    >
      <TrashIcon />
      {armed ? 'Tap again to confirm' : label}
    </button>
  );
}

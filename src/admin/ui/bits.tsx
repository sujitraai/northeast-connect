import { useEffect, useState, type ReactNode } from 'react';
import { Icon, Spinner, type IconName } from '../../components/icons';
import type { Tone } from '../lib/labels';

/** Grey pill on every row with is_demo = true. */
export function DemoBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-chip px-2.5 py-1 text-[11.5px] font-bold text-muted">
      Demo data
    </span>
  );
}

const PILL: Record<Tone | 'safe' | 'neutral', string> = {
  watch: 'bg-watch-soft text-watch',
  danger: 'bg-danger-soft text-danger',
  safe: 'bg-safe-soft text-safe',
  neutral: 'bg-chip text-muted',
};

/** Status pill with a dot, e.g. WATCH / DANGER. */
export function StatusPill({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold tracking-[0.02em] ${PILL[tone]}`}
    >
      <i className="size-[7px] rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Notice({ tone, children }: { tone: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const cls = {
    error: 'bg-danger-soft text-[#991B1B]',
    ok: 'bg-safe-soft text-[#166534]',
    info: 'bg-primary-soft text-navy',
  }[tone];
  const icon: IconName = tone === 'error' ? 'alert' : tone === 'ok' ? 'check' : 'bell';
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-btn px-4 py-3 text-sm font-semibold ${cls}`}
    >
      <Icon name={icon} size={18} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}

const BTN = 'inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-[18px] text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

/** Navy main button. */
export function PrimaryButton({
  children,
  busy,
  type = 'button',
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode;
  busy?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={busy || disabled} className={`${BTN} bg-navy text-white hover:bg-[#1a2a57] ${className}`}>
      {busy && <Spinner size={16} />}
      {children}
    </button>
  );
}

/** White button with a thin outline. */
export function GhostButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = `${BTN} bg-white text-ink ring-1 ring-line ring-inset hover:bg-bg`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** Two-tap delete: first tap arms it, second tap (within 4 s) deletes. */
function useArmed() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return [armed, setArmed] as const;
}

export function DeleteButton({
  onConfirm,
  label = 'Delete',
  busy,
}: {
  onConfirm: () => void;
  label?: string;
  busy?: boolean;
}) {
  const [armed, setArmed] = useArmed();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
      className={`${BTN} ${armed ? 'bg-danger text-white' : 'bg-danger-soft text-danger hover:bg-[#fbdada]'}`}
    >
      <Icon name="trash" size={16} />
      {armed ? 'Tap again to delete' : label}
    </button>
  );
}

/** Small square icon button for table rows (edit / delete). */
export function IconButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-xl transition active:scale-95 ${
        danger ? 'bg-danger text-white' : 'bg-bg text-muted hover:text-ink'
      }`}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

/** Trash icon that asks for a second tap before deleting. */
export function DeleteIconButton({ onConfirm, what }: { onConfirm: () => void; what: string }) {
  const [armed, setArmed] = useArmed();
  return armed ? (
    <button
      type="button"
      onClick={() => (setArmed(false), onConfirm())}
      className="h-10 rounded-xl bg-danger px-3 text-xs font-extrabold text-white"
    >
      Delete?
    </button>
  ) : (
    <IconButton icon="trash" label={`Delete ${what}`} onClick={() => setArmed(true)} />
  );
}

/** On/off switch (green when on), as in the reference. */
export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-safe' : 'bg-[#CBD5E1]'}`}
    >
      <span
        className={`absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

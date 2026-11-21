import type { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}

/** Large (56px) round map control — easy to hit on a phone. */
export default function MapButton({ label, onClick, children, active, disabled }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-lg backdrop-blur transition active:scale-95 disabled:opacity-70 ${
        active
          ? 'border-sky-400 bg-sky-500/90 text-white'
          : 'border-white/15 bg-slate-900/85 text-slate-100 hover:bg-slate-800/90'
      }`}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}

/** 46px rounded-square map control (right rail). Active = primary blue. */
export default function MapButton({ label, onClick, children, active, disabled }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`pointer-events-auto grid size-[46px] place-items-center rounded-btn shadow-soft transition active:scale-95 disabled:opacity-80 ${
        active ? 'bg-primary text-white' : 'bg-white text-ink-2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from 'react';
import { CloseIcon } from './icons';

export type CardTone = 'info' | 'warning' | 'error';

const TONES: Record<CardTone, string> = {
  info: 'border-sky-400/40',
  warning: 'border-amber-400/70',
  error: 'border-red-400/70',
};

interface Props {
  tone: CardTone;
  title: string;
  children?: ReactNode;
  onClose: () => void;
}

/** Bottom card for short status messages. */
export default function InfoCard({ tone, title, children, onClose }: Props) {
  return (
    <div
      role={tone === 'info' ? 'status' : 'alert'}
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-slate-900/90 p-4 text-slate-100 shadow-2xl backdrop-blur ${TONES[tone]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-snug">{title}</p>
        {children && <div className="mt-1 text-base text-slate-300">{children}</div>}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="-m-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

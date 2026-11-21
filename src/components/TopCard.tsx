import type { ReactNode } from 'react';
import Rhino, { type RhinoMood } from './Rhino';
import { Icon } from './icons';

/** Tile colour behind the mascot. "neutral" = no safety check has been made. */
export type CardTone = 'neutral' | 'safe' | 'watch' | 'warn' | 'danger';

const TILE: Record<CardTone, string> = {
  neutral: 'bg-primary-soft',
  safe: 'bg-safe-soft',
  watch: 'bg-watch-soft',
  warn: 'bg-warn-soft',
  danger: 'bg-danger-soft',
};

export interface TopCardContent {
  mood: RhinoMood;
  tone: CardTone;
  greet: string;
  headline: string;
  bubble: string;
  /** The danger shown comes from demo data: say so. */
  demo?: boolean;
}

interface Props extends TopCardContent {
  action?: ReactNode;
  onClose?: () => void;
}

/** Floating card at the top of the map: mascot + where you are + plain advice. */
export default function TopCard({ mood, tone, greet, headline, bubble, demo, action, onClose }: Props) {
  return (
    <section
      aria-live="polite"
      className="pointer-events-auto flex items-center gap-3 rounded-card bg-white/95 p-3 pr-3.5 shadow-soft backdrop-blur-md"
    >
      <div className={`grid size-16 shrink-0 place-items-center self-start rounded-inner ${TILE[tone]}`}>
        <Rhino mood={mood} className="h-[54px] w-[58px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-muted">{greet}</p>
        <h1 className="mt-px text-[17px] leading-tight font-extrabold tracking-[-0.01em] text-ink">{headline}</h1>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">{bubble}</p>
        {demo && (
          <span className="mt-1.5 inline-flex rounded-full bg-chip px-2.5 py-0.5 text-[11.5px] font-bold text-muted">Demo data</span>
        )}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center self-start rounded-xl bg-bg text-muted active:scale-95"
        >
          <Icon name="x" size={18} />
        </button>
      )}
    </section>
  );
}

/** Small action button that sits inside the top card. */
export function CardAction({
  icon,
  children,
  onClick,
  busy,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-3.5 text-sm font-extrabold text-white active:scale-[0.98] disabled:opacity-80"
    >
      {icon}
      {children}
    </button>
  );
}

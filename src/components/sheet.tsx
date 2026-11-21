import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/** Decorative drag handle at the top of a sheet (phone only). */
export function Handle() {
  return <div aria-hidden className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-handle lg:hidden" />;
}

/** Title row of a tall tab sheet: big title + close button. */
export function SheetHead({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <header className="mb-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
        <button
          type="button"
          aria-label="Close and go back to the map"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg text-muted active:scale-95"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      {sub && <p className="mt-0.5 text-[13.5px] font-semibold text-muted">{sub}</p>}
    </header>
  );
}

/** Small uppercase heading over a group of rows (as in the reference). */
export function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mx-0.5 mt-4 mb-2 text-xs font-extrabold tracking-[0.08em] text-muted uppercase">{children}</h3>
  );
}

/** Calm placeholder for a list that has nothing in it yet. */
export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-inner bg-bg px-6 py-8 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-white text-ink-2 shadow-soft">
        <Icon name={icon} size={26} />
      </div>
      <p className="mt-4 text-base font-extrabold text-ink">{title}</p>
      <p className="mt-1 max-w-[30ch] text-[13.5px] leading-snug font-medium text-muted">{children}</p>
    </div>
  );
}

/** "Get help now": full-width navy button with a red round phone icon. */
export function GetHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[18px] bg-navy text-base font-extrabold text-white active:scale-[0.99]"
    >
      <span className="grid size-[26px] place-items-center rounded-full bg-danger">
        <Icon name="phone" size={14} />
      </span>
      Get help now
    </button>
  );
}

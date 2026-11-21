import type { FormEvent, ReactNode } from 'react';
import { BackIcon, PlusIcon } from './icons';
import { DeleteButton, GhostButton, Notice, PrimaryButton } from './bits';

export function SectionHeader({
  title,
  count,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  count?: number;
  addLabel?: string;
  onAdd?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          {title}
          {count !== undefined && (
            <span className="ml-3 align-middle text-lg font-semibold text-slate-500">{count}</span>
          )}
        </h2>
        {onAdd && addLabel && (
          <PrimaryButton onClick={onAdd}>
            <PlusIcon />
            {addLabel}
          </PrimaryButton>
        )}
      </div>
      {children && <div className="mt-2 max-w-prose text-base text-slate-400">{children}</div>}
    </div>
  );
}

/** One panel holding the rows, split by lines (not a stack of cards). */
export function ListPanel({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: ReactNode;
  children: ReactNode[];
}) {
  if (error) return <Notice tone="error">{error}</Notice>;
  if (loading && children.length === 0) {
    return <p className="py-10 text-center text-base text-slate-400">Loading…</p>;
  }
  if (children.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-base text-slate-400">
        {empty}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      {children}
    </ul>
  );
}

/** A tappable row. `accent` paints a status bar on the left edge. */
export function Row({
  onClick,
  accent,
  children,
  end,
}: {
  onClick: () => void;
  accent?: string;
  children: ReactNode;
  end?: ReactNode;
}) {
  return (
    <li className="relative">
      {accent && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: accent }} />
      )}
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-4 pr-4 pl-5 text-left transition hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">{children}</div>
        {end}
        <span className="shrink-0 text-sm font-semibold text-sky-300">Edit</span>
      </button>
    </li>
  );
}

/** Full-page form with a back link, title and Save / Cancel / Delete. */
export function FormShell({
  title,
  onBack,
  onSubmit,
  onDelete,
  saving,
  error,
  saveLabel,
  children,
}: {
  title: string;
  onBack: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  saving: boolean;
  error: string | null;
  saveLabel: string;
  children: ReactNode;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} noValidate className="max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-base font-semibold text-slate-300 hover:text-white"
      >
        <BackIcon />
        Back to list
      </button>
      <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white">{title}</h2>

      <div className="space-y-5">{children}</div>

      {error && (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#0b0f14]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <PrimaryButton type="submit" busy={saving}>
          {saving ? 'Saving…' : saveLabel}
        </PrimaryButton>
        <GhostButton onClick={onBack}>Cancel</GhostButton>
        {onDelete && (
          <div className="ml-auto">
            <DeleteButton onConfirm={onDelete} busy={saving} />
          </div>
        )}
      </div>
    </form>
  );
}

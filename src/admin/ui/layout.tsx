import type { FormEvent, ReactNode } from 'react';
import { Icon } from '../../components/icons';
import { DeleteButton, GhostButton, Notice, PrimaryButton } from './bits';

/** Page title, one line of help, actions on the right. */
export function PageHeader({ title, help, actions }: { title: string; help?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
        {help && <p className="mt-1 max-w-[62ch] text-[13.5px] font-semibold text-muted">{help}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}

/** White rounded panel; optional title row with something on the right. */
export function Panel({
  title,
  side,
  children,
  className = '',
}: {
  title?: ReactNode;
  side?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card bg-white p-4 sm:p-[18px] ${className}`}>
      {(title || side) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-ink">{title}</h3>
          {side}
        </div>
      )}
      {children}
    </section>
  );
}

/** Calm, helpful text when a list is empty or still loading. */
export function ListMessage({ children }: { children: ReactNode }) {
  return <p className="rounded-inner bg-bg px-5 py-10 text-center text-sm font-semibold text-muted">{children}</p>;
}

/**
 * Add / edit page: back link, title, then the form card. With `map`, the map
 * card sits on the left and the form on the right (stacked on phones).
 */
export function FormShell({
  title,
  help,
  onBack,
  onSubmit,
  onDelete,
  saving,
  error,
  saveLabel,
  map,
  children,
}: {
  title: string;
  help?: ReactNode;
  onBack: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  saving: boolean;
  error: string | null;
  saveLabel: string;
  map?: ReactNode;
  children: ReactNode;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} noValidate>
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-muted hover:text-ink"
      >
        <Icon name="back" size={18} />
        Back to list
      </button>
      <PageHeader title={title} help={help} />

      <div className={map ? 'grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]' : 'max-w-2xl'}>
        {map}
        <Panel>
          <div className="space-y-4">{children}</div>
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <PrimaryButton type="submit" busy={saving} className="flex-1">
              {saving ? 'Saving…' : saveLabel}
            </PrimaryButton>
            <GhostButton onClick={onBack}>Cancel</GhostButton>
          </div>
          {onDelete && (
            <div className="mt-4 border-t border-line pt-4">
              <DeleteButton onConfirm={onDelete} busy={saving} />
            </div>
          )}
        </Panel>
      </div>
    </form>
  );
}

import type { ReactNode } from 'react';

export interface Column<R> {
  header: string;
  cell: (row: R) => ReactNode;
  /** On phones the first column is the card title; others show as small meta, or are hidden. */
  mobile?: 'meta' | 'hide';
}

interface Props<R> {
  rows: R[];
  columns: Column<R>[];
  /** Edit / delete buttons for each row. */
  actions?: (row: R) => ReactNode;
  /** Rows that are switched off look faded. */
  faded?: (row: R) => boolean;
}

/** A table on wide screens; a stack of cards on phones. */
export default function DataTable<R extends { id: string }>({ rows, columns, actions, faded }: Props<R>) {
  const [first, ...rest] = columns;
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.header}
                  className="border-b border-line px-3 py-2.5 text-left text-[11.5px] font-extrabold tracking-[0.08em] whitespace-nowrap text-muted uppercase"
                >
                  {c.header}
                </th>
              ))}
              {actions && <th className="border-b border-line" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`[&:last-child>td]:border-0 ${faded?.(r) ? 'opacity-55' : ''}`}>
                {columns.map((c) => (
                  <td key={c.header} className="border-b border-line px-3 py-3 text-[13.5px] font-semibold text-ink-2">
                    {c.cell(r)}
                  </td>
                ))}
                {actions && (
                  <td className="border-b border-line px-3 py-3">
                    <div className="flex justify-end gap-1.5">{actions(r)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 lg:hidden">
        {rows.map((r) => (
          <li key={r.id} className={`rounded-[18px] bg-bg p-3 ${faded?.(r) ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 text-[14.5px]">{first.cell(r)}</div>
              {actions && <div className="flex shrink-0 gap-1.5">{actions(r)}</div>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] font-semibold text-muted">
              {rest
                .filter((c) => c.mobile !== 'hide')
                .map((c) => (
                  <span key={c.header} className="inline-flex items-center gap-1.5">
                    {c.cell(r)}
                  </span>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

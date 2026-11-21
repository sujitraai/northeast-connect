import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useRows, type EditableTable, type RowOf } from '../lib/data';
import type { FormProps } from '../lib/useSaver';
import { Notice } from './bits';
import { ListPanel, SectionHeader } from './layout';

interface Props<T extends EditableTable> {
  table: T;
  title: string;
  intro: ReactNode;
  addLabel: string;
  empty: ReactNode;
  sort?: (a: RowOf<T>, b: RowOf<T>) => number;
  renderRow: (row: RowOf<T>, edit: () => void) => ReactNode;
  Form: ComponentType<FormProps<RowOf<T>>>;
}

/** List of rows with an Add button; tapping a row (or Add) swaps in the form. */
export default function CrudSection<T extends EditableTable>({
  table,
  title,
  intro,
  addLabel,
  empty,
  sort,
  renderRow,
  Form,
}: Props<T>) {
  const { rows, loading, error, reload } = useRows(table);
  const [editing, setEditing] = useState<RowOf<T> | 'new' | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [editing]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  if (editing) {
    return (
      <Form
        row={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={(msg) => {
          setEditing(null);
          setFlash(msg);
          void reload();
        }}
      />
    );
  }

  const list = sort ? [...rows].sort(sort) : rows;

  return (
    <section>
      <SectionHeader title={title} count={loading ? undefined : rows.length} addLabel={addLabel} onAdd={() => setEditing('new')}>
        {intro}
      </SectionHeader>
      {flash && (
        <div className="mb-4">
          <Notice tone="ok">{flash}</Notice>
        </div>
      )}
      <ListPanel loading={loading} error={error} empty={empty}>
        {list.map((r) => renderRow(r, () => setEditing(r)))}
      </ListPanel>
    </section>
  );
}

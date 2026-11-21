import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Icon } from '../../components/icons';
import { deleteRow, useRows, type EditableTable, type RowOf } from '../lib/data';
import type { FormProps } from '../lib/useSaver';
import { DeleteIconButton, IconButton, Notice, PrimaryButton } from './bits';
import DataTable, { type Column } from './DataTable';
import { ListMessage, PageHeader, Panel } from './layout';

interface Props<T extends EditableTable> {
  table: T;
  title: string;
  help: ReactNode;
  listTitle: string;
  addLabel: string;
  /** Singular name for messages, e.g. "disaster". */
  noun: string;
  empty: ReactNode;
  sort?: (a: RowOf<T>, b: RowOf<T>) => number;
  /** Built from `reload`, so a column (e.g. the Public switch) can refresh the list. */
  columns: (reload: () => void, report: (msg: string) => void) => Column<RowOf<T>>[];
  faded?: (row: RowOf<T>) => boolean;
  Form: ComponentType<FormProps<RowOf<T>>>;
  /** Open the "add" form straight away (from an "Add" button elsewhere). */
  startNew?: boolean;
}

/** Props every list page accepts from the shell. */
export interface SectionProps {
  startNew?: boolean;
}

/** Page with an Add button and a table; edit (or Add) swaps in the form. */
export default function CrudSection<T extends EditableTable>({
  table,
  title,
  help,
  listTitle,
  addLabel,
  noun,
  empty,
  sort,
  columns,
  faded,
  Form,
  startNew,
}: Props<T>) {
  const { rows, loading, error, reload } = useRows(table);
  const [editing, setEditing] = useState<RowOf<T> | 'new' | null>(startNew ? 'new' : null);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

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
          setFlash({ tone: 'ok', text: msg });
          void reload();
        }}
      />
    );
  }

  const remove = async (row: RowOf<T>) => {
    const err = await deleteRow(table, row.id);
    setFlash(err ? { tone: 'error', text: err } : { tone: 'ok', text: `The ${noun} was deleted.` });
    void reload();
  };

  const list = sort ? [...rows].sort(sort) : rows;
  const cols = columns(
    () => void reload(),
    (text) => setFlash({ tone: 'error', text }),
  );

  return (
    <section>
      <PageHeader
        title={title}
        help={help}
        actions={
          <PrimaryButton onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} />
            {addLabel}
          </PrimaryButton>
        }
      />
      {flash && (
        <div className="mb-4">
          <Notice tone={flash.tone}>{flash.text}</Notice>
        </div>
      )}
      <Panel title={listTitle} side={!loading && <span className="text-[13px] font-bold text-muted">{rows.length} in total</span>}>
        {error ? (
          <Notice tone="error">{error}</Notice>
        ) : loading && rows.length === 0 ? (
          <ListMessage>Loading…</ListMessage>
        ) : rows.length === 0 ? (
          <ListMessage>{empty}</ListMessage>
        ) : (
          <DataTable
            rows={list}
            columns={cols}
            faded={faded}
            actions={(r) => (
              <>
                <IconButton icon="edit" label={`Edit ${noun}`} onClick={() => setEditing(r)} />
                <DeleteIconButton what={noun} onConfirm={() => void remove(r)} />
              </>
            )}
          />
        )}
      </Panel>
    </section>
  );
}

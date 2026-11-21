import { useState } from 'react';
import { Icon, Spinner } from '../../components/icons';
import type { Disaster } from '../../lib/database.types';
import { addDemoNgo } from '../lib/demo';
import type { Report } from './CrudSection';

/** "Add help group" on a disaster row: one tap adds a demo help group working there. */
export default function AddNgoButton({ d, report }: { d: Disaster; report: Report }) {
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    const { error, name } = await addDemoNgo(d);
    setBusy(false);
    report(error ?? `${name} (demo) is now helping at “${d.title}”. Edit it under Help groups.`, error ? 'error' : 'ok');
  };
  return (
    <button
      type="button"
      onClick={() => void add()}
      disabled={busy}
      title="Add a help group at this disaster (demo)"
      className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-soft px-3 text-xs font-extrabold text-primary transition active:scale-95 disabled:opacity-50"
    >
      {busy ? <Spinner size={14} /> : <Icon name="users" size={14} />}
      Add help group
    </button>
  );
}

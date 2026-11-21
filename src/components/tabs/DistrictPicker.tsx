import { useMemo, useState } from 'react';
import type { DistrictsFC } from '../../lib/region';
import { Icon } from '../icons';
import { GroupTitle, SheetHead } from '../sheet';

interface Props {
  districts: DistrictsFC | null;
  current: { district: string; state: string } | null;
  onPick: (district: string, state: string) => void;
  onClose: () => void;
}

/** For people who don't share their location: pick your district from a list. */
export default function DistrictPicker({ districts, current, onPick, onClose }: Props) {
  const [q, setQ] = useState('');

  // { state: [district, …] }, both sorted, filtered by the search box.
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byState = new Map<string, string[]>();
    for (const f of districts?.features ?? []) {
      const { district, state } = f.properties;
      if (needle && !district.toLowerCase().includes(needle) && !state.toLowerCase().includes(needle)) continue;
      byState.set(state, [...(byState.get(state) ?? []), district]);
    }
    return [...byState.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, list]) => ({ state, list: list.sort((a, b) => a.localeCompare(b)) }));
  }, [districts, q]);

  return (
    <>
      <SheetHead title="Choose your district" sub="We'll check for danger near it." onClose={onClose} />
      <label className="mt-3 flex h-12 items-center gap-2 rounded-btn bg-bg px-3.5 text-muted focus-within:ring-2 focus-within:ring-primary">
        <Icon name="search" size={18} />
        <span className="sr-only">Search districts</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search, e.g. Kamrup or Shillong"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:font-medium placeholder:text-faint"
        />
      </label>

      {!districts && <p className="mt-6 text-center text-sm font-semibold text-muted">Loading districts…</p>}
      {districts && groups.length === 0 && (
        <p className="mt-6 text-center text-sm font-semibold text-muted">No district matches “{q}”.</p>
      )}

      {groups.map((g) => (
        <section key={g.state}>
          <GroupTitle>{g.state}</GroupTitle>
          <ul className="space-y-1.5">
            {g.list.map((d) => {
              const on = current?.district === d && current.state === g.state;
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => onPick(d, g.state)}
                    aria-current={on ? 'true' : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-btn px-3.5 text-left text-[15px] font-bold ${
                      on ? 'bg-primary-soft text-primary' : 'bg-bg text-ink'
                    }`}
                  >
                    <Icon name="pin" size={18} />
                    <span className="flex-1">{d}</span>
                    {on && <Icon name="check" size={18} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

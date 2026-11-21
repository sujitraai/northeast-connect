import { useId, useMemo, type ReactNode } from 'react';
import { useGeo } from '../geo';
import { NE_STATES } from '../lib/labels';
import { SelectField, TextField, Toggle } from './fields';

/** Green "AUTO" badge: the value was filled in from the map tap. */
export function AutoBadge() {
  return (
    <span className="rounded-full bg-safe-soft px-2 py-[3px] text-[11px] font-extrabold text-safe">AUTO</span>
  );
}

/** State dropdown + district box (suggests the districts of that state). */
export function PlaceFields({
  state,
  district,
  onState,
  onDistrict,
  allowAll,
  auto,
}: {
  state: string;
  district: string;
  onState: (s: string) => void;
  onDistrict: (d: string) => void;
  /** Adds an "All states" choice (for contacts that work everywhere). */
  allowAll?: boolean;
  /** Both values came from the map tap and haven't been edited. */
  auto?: boolean;
}) {
  const geo = useGeo();
  const listId = useId();
  const districts = useMemo(
    () =>
      (geo.districts?.features ?? [])
        .map((f) => f.properties)
        .filter((p) => !state || p.state === state)
        .map((p) => p.district)
        .sort(),
    [geo.districts, state],
  );

  const options = [
    { value: '', label: allowAll ? 'All North East states' : 'Choose a state' },
    ...NE_STATES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <SelectField label="State" value={state} onChange={onState} options={options} />
      <div>
        <TextField
          label="District"
          hint={allowAll ? 'Empty = all districts' : undefined}
          value={district}
          onChange={onDistrict}
          list={listId}
          maxLength={80}
          badge={auto && district ? <AutoBadge /> : undefined}
        />
        <datalist id={listId}>
          {districts.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

/**
 * "Is this real?" — every row says whether it is demo data and where it came
 * from. Other switches (e.g. "Show on public map") can sit in the same row.
 */
export function HonestyFields({
  isDemo,
  source,
  onDemo,
  onSource,
  children,
}: {
  isDemo: boolean;
  source: string;
  onDemo: (v: boolean) => void;
  onSource: (v: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-4 rounded-btn bg-bg p-3.5 sm:flex-row">
        {children}
        <Toggle
          label="Demo data"
          hint={isDemo ? 'Labelled "Demo data" for the public.' : 'Shown as real. Add a source.'}
          checked={isDemo}
          onChange={onDemo}
        />
      </div>
      <TextField
        label="Source"
        hint={isDemo ? 'Optional' : 'Where this came from'}
        placeholder="e.g. ASDMA flood bulletin, 21 Nov"
        value={source}
        onChange={onSource}
        maxLength={200}
      />
    </div>
  );
}

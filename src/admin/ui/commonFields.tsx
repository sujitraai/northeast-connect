import { useId, useMemo } from 'react';
import { useGeo } from '../geo';
import { NE_STATES } from '../lib/labels';
import { SelectField, TextField, Toggle } from './fields';

/** State dropdown + district box (suggests the districts of that state). */
export function PlaceFields({
  state,
  district,
  onState,
  onDistrict,
  allowAll,
}: {
  state: string;
  district: string;
  onState: (s: string) => void;
  onDistrict: (d: string) => void;
  /** Adds an "All states" choice (for contacts that work everywhere). */
  allowAll?: boolean;
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
    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField label="State" value={state} onChange={onState} options={options} />
      <div>
        <TextField
          label="District"
          hint={allowAll ? 'Empty = all districts' : undefined}
          value={district}
          onChange={onDistrict}
          list={listId}
          maxLength={80}
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

/** "Is this real?" — every row says whether it is demo data and where it came from. */
export function HonestyFields({
  isDemo,
  source,
  onDemo,
  onSource,
}: {
  isDemo: boolean;
  source: string;
  onDemo: (v: boolean) => void;
  onSource: (v: string) => void;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-dashed border-white/15 p-4">
      <Toggle
        label="Demo data"
        hint={
          isDemo
            ? 'The public app will label this "Demo data". Turn off only for real, checked information.'
            : 'This will be shown as real information. Make sure it is checked and add a source.'
        }
        checked={isDemo}
        onChange={onDemo}
      />
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

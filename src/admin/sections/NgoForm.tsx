import { useState } from 'react';
import type { Ngo } from '../../lib/database.types';
import { useGeo } from '../geo';
import { deleteRow, inNeBox, orNull, PHONE_RE, saveRow, useRows } from '../lib/data';
import { useSaver, type FormProps } from '../lib/useSaver';
import { HonestyFields } from '../ui/commonFields';
import { SelectField, TextField, Toggle } from '../ui/fields';
import { FormShell, Panel } from '../ui/layout';
import PointPicker, { type PickedPoint } from '../ui/PointPicker';

export default function NgoForm({ row, onDone, onCancel }: FormProps<Ngo>) {
  const geo = useGeo();
  const disasters = useRows('disasters');
  const { saving, error, setError, run } = useSaver();
  const [name, setName] = useState(row?.name ?? '');
  const [phone, setPhone] = useState(row?.phone ?? '');
  const [focus, setFocus] = useState(row?.focus ?? '');
  const [disasterId, setDisasterId] = useState(row?.disaster_id ?? '');
  const [point, setPoint] = useState<PickedPoint | null>(
    row?.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : null,
  );
  // Remount the picker when the point is set from outside the map.
  const [pickerKey, setPickerKey] = useState(0);
  const [active, setActive] = useState(row?.active ?? true);
  const [isDemo, setIsDemo] = useState(row?.is_demo ?? true);
  const [source, setSource] = useState(row?.source ?? '');

  const linked = disasters.rows.find((d) => d.id === disasterId);

  const submit = () => {
    if (!name.trim()) return setError('Enter the group’s name.');
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      return setError('Enter the phone number using digits only, or leave it empty.');
    }
    if (isDemo && phone.replace(/\D/g, '').length > 6) {
      return setError('Demo groups must not have a real-looking phone number. Leave it empty.');
    }
    if (point && !inNeBox(point.lat, point.lng)) return setError('The location must be inside North East India.');
    if (!isDemo && !source.trim()) return setError('Real information needs a source. Add where it came from.');

    void run(
      () =>
        saveRow('ngos', row?.id ?? null, {
          name: name.trim(),
          phone: orNull(phone),
          focus: orNull(focus),
          disaster_id: disasterId || null,
          lat: point?.lat ?? null,
          lng: point?.lng ?? null,
          active,
          is_demo: isDemo,
          source: orNull(source),
        }),
      () => onDone(row ? 'Group updated.' : 'Group added.'),
    );
  };

  const remove = () => row && void run(() => deleteRow('ngos', row.id), () => onDone('Group deleted.'));

  const disasterOptions = [
    { value: '', label: 'Not linked to a disaster' },
    ...disasters.rows.map((d) => ({
      value: d.id,
      label: `${d.title}${d.active ? '' : ' (hidden)'}${d.is_demo ? ' (demo)' : ''}`,
    })),
  ];

  const small = 'min-h-9 rounded-xl bg-bg px-3 text-xs font-bold text-ink-2 hover:bg-chip';
  const map = (
    <Panel
      title={
        <>
          Where are they working? <span className="font-semibold text-muted">Optional</span>
        </>
      }
      side={
        <div className="flex gap-2">
          {linked && (
            <button
              type="button"
              onClick={() => {
                setPoint({ lat: linked.lat, lng: linked.lng });
                setPickerKey((k) => k + 1);
              }}
              className={small}
            >
              Use the disaster’s location
            </button>
          )}
          {point && (
            <button type="button" onClick={() => setPoint(null)} className={small}>
              Remove location
            </button>
          )}
        </div>
      }
    >
      <PointPicker key={pickerKey} geo={geo} value={point} onChange={(p) => setPoint(p)} />
    </Panel>
  );

  return (
    <FormShell
      title={row ? 'Edit help group' : 'New NGO or help group'}
      help="Link the group to the disaster they are helping at."
      onBack={onCancel}
      onSubmit={submit}
      onDelete={row ? remove : undefined}
      saving={saving}
      error={error}
      saveLabel={row ? 'Save changes' : 'Save group'}
      map={map}
    >
      <TextField label="Name" placeholder="e.g. Brahmaputra Relief Volunteers" value={name} onChange={setName} maxLength={120} />
      <TextField label="What they help with" placeholder="e.g. rescue boats, food, medicine" value={focus} onChange={setFocus} maxLength={200} />
      <TextField label="Phone number" hint="Optional" type="tel" inputMode="tel" value={phone} onChange={setPhone} maxLength={20} />
      <SelectField label="Working at disaster" value={disasterId} onChange={setDisasterId} options={disasterOptions} />
      <HonestyFields isDemo={isDemo} source={source} onDemo={setIsDemo} onSource={setSource}>
        <Toggle
          label="Active now"
          hint={active ? 'Shown to people as helping.' : 'Not shown to people.'}
          checked={active}
          onChange={setActive}
        />
      </HonestyFields>
    </FormShell>
  );
}

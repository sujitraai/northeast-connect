import { useState } from 'react';
import type { Shelter } from '../../lib/database.types';
import { useGeo } from '../geo';
import { deleteRow, inNeBox, orNull, PHONE_RE, saveRow } from '../lib/data';
import { SHELTER_TYPES } from '../lib/labels';
import { useSaver, type FormProps } from '../lib/useSaver';
import { HonestyFields, PlaceFields } from '../ui/commonFields';
import { Segmented, TextField } from '../ui/fields';
import { FormShell, Panel } from '../ui/layout';
import PointPicker, { type PickedPoint } from '../ui/PointPicker';

export default function ShelterForm({ row, onDone, onCancel }: FormProps<Shelter>) {
  const geo = useGeo();
  const { saving, error, setError, run } = useSaver();
  const [name, setName] = useState(row?.name ?? '');
  const [type, setType] = useState(row?.type ?? 'relief_camp');
  const [point, setPoint] = useState<PickedPoint | null>(row ? { lat: row.lat, lng: row.lng } : null);
  const [capacity, setCapacity] = useState(row?.capacity != null ? String(row.capacity) : '');
  const [phone, setPhone] = useState(row?.phone ?? '');
  const [state, setState] = useState(row?.state ?? '');
  const [district, setDistrict] = useState(row?.district ?? '');
  const [autoPlace, setAutoPlace] = useState(false);
  const [isDemo, setIsDemo] = useState(row?.is_demo ?? true);
  const [source, setSource] = useState(row?.source ?? '');

  const submit = () => {
    if (!name.trim()) return setError('Enter a name, e.g. "Dhemaji Higher Secondary School camp".');
    if (!point || !inNeBox(point.lat, point.lng)) return setError('Tap the map to set where the shelter is.');
    const cap = capacity.trim() === '' ? null : Number(capacity);
    if (cap !== null && !(Number.isInteger(cap) && cap >= 0)) {
      return setError('Capacity must be a whole number of people, or left empty.');
    }
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      return setError('Enter the phone number using digits only, or leave it empty.');
    }
    if (isDemo && phone.replace(/\D/g, '').length > 6) {
      return setError('Demo shelters must not have a real-looking phone number. Leave it empty.');
    }
    if (!isDemo && !source.trim()) return setError('Real information needs a source. Add where it came from.');

    void run(
      () =>
        saveRow('shelters', row?.id ?? null, {
          name: name.trim(),
          type,
          lat: point.lat,
          lng: point.lng,
          capacity: cap,
          phone: orNull(phone),
          state: orNull(state),
          district: orNull(district),
          is_demo: isDemo,
          source: orNull(source),
        }),
      () => onDone(row ? 'Shelter updated.' : 'Shelter added.'),
    );
  };

  const remove = () => row && void run(() => deleteRow('shelters', row.id), () => onDone('Shelter deleted.'));

  const map = (
    <Panel title="Place on map">
      <PointPicker
        geo={geo}
        value={point}
        color="#16A34A"
        onChange={(p, place) => {
          setPoint(p);
          setState(place.state);
          setDistrict(place.district ?? '');
          setAutoPlace(true);
        }}
      />
    </Panel>
  );

  return (
    <FormShell
      title={row ? 'Edit shelter' : 'New shelter or hospital'}
      help="Tap the map to place it. People in danger are sent to the nearest one."
      onBack={onCancel}
      onSubmit={submit}
      onDelete={row ? remove : undefined}
      saving={saving}
      error={error}
      saveLabel={row ? 'Save changes' : 'Save shelter'}
      map={map}
    >
      <TextField label="Name" placeholder="e.g. Relief camp, Govt. school" value={name} onChange={setName} maxLength={120} />
      <Segmented label="Type" value={type} onChange={setType} options={SHELTER_TYPES} />
      <PlaceFields
        state={state}
        district={district}
        auto={autoPlace}
        onState={(v) => (setState(v), setAutoPlace(false))}
        onDistrict={(v) => (setDistrict(v), setAutoPlace(false))}
      />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <TextField label="Space for" hint="People" type="number" inputMode="numeric" value={capacity} onChange={setCapacity} />
        <TextField label="Phone number" hint="Optional" type="tel" inputMode="tel" value={phone} onChange={setPhone} maxLength={20} />
      </div>
      <HonestyFields isDemo={isDemo} source={source} onDemo={setIsDemo} onSource={setSource} />
    </FormShell>
  );
}

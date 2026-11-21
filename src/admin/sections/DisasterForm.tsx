import { useState } from 'react';
import { DISASTER_ICON, Icon } from '../../components/icons';
import type { Disaster } from '../../lib/database.types';
import { useGeo } from '../geo';
import { deleteRow, inNeBox, orNull, saveRow } from '../lib/data';
import { DISASTER_TYPES, SEVERITIES, severityOf } from '../lib/labels';
import { useSaver, type FormProps } from '../lib/useSaver';
import { HonestyFields, PlaceFields } from '../ui/commonFields';
import { RangeField, Segmented, TextArea, TextField, Toggle } from '../ui/fields';
import { FormShell, Panel } from '../ui/layout';
import PointPicker, { type PickedPoint } from '../ui/PointPicker';

const MAX_RADIUS = 300;

export default function DisasterForm({ row, onDone, onCancel }: FormProps<Disaster>) {
  const geo = useGeo();
  const { saving, error, setError, run } = useSaver();

  const [title, setTitle] = useState(row?.title ?? '');
  const [type, setType] = useState(row?.type ?? 'flood');
  const [severity, setSeverity] = useState(row?.severity ?? 'moderate');
  const [point, setPoint] = useState<PickedPoint | null>(row ? { lat: row.lat, lng: row.lng } : null);
  const [radius, setRadius] = useState(String(row?.radius_km ?? 10));
  const [state, setState] = useState(row?.state ?? '');
  const [district, setDistrict] = useState(row?.district ?? '');
  const [autoPlace, setAutoPlace] = useState(false);
  const [description, setDescription] = useState(row?.description ?? '');
  const [active, setActive] = useState(row?.active ?? true);
  const [isDemo, setIsDemo] = useState(row?.is_demo ?? true);
  const [source, setSource] = useState(row?.source ?? '');

  const radiusNum = Number(radius);
  const color = severityOf(severity).color;

  const submit = () => {
    if (!title.trim()) return setError('Give the disaster a short title, e.g. "Flood – Dhemaji".');
    if (!point || !inNeBox(point.lat, point.lng)) return setError('Tap the map to set where the disaster is.');
    if (!(radiusNum > 0 && radiusNum <= MAX_RADIUS)) {
      return setError(`The affected area must be between 1 and ${MAX_RADIUS} km.`);
    }
    if (!isDemo && !source.trim()) return setError('Real information needs a source. Add where it came from.');

    void run(
      () =>
        saveRow('disasters', row?.id ?? null, {
          title: title.trim(),
          type,
          severity,
          lat: point.lat,
          lng: point.lng,
          radius_km: Math.round(radiusNum * 100) / 100,
          state: orNull(state),
          district: orNull(district),
          description: orNull(description),
          active,
          is_demo: isDemo,
          source: orNull(source),
        }),
      () => onDone(row ? 'Disaster updated.' : 'Disaster added.'),
    );
  };

  const remove = () => row && void run(() => deleteRow('disasters', row.id), () => onDone('Disaster deleted.'));

  const map = (
    <Panel
      title="Place on map"
      side={
        district && (
          <span className="rounded-full bg-chip px-2.5 py-1 text-[11.5px] font-bold text-muted">{district}</span>
        )
      }
    >
      <PointPicker
        geo={geo}
        value={point}
        radiusKm={radiusNum}
        color={color}
        onChange={(p, place) => {
          setPoint(p);
          setState(place.state);
          setDistrict(place.district ?? '');
          setAutoPlace(true);
        }}
      />
      {point && (
        <p className="mt-2 text-xs font-semibold text-muted">
          Centre {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </p>
      )}
    </Panel>
  );

  return (
    <FormShell
      title={row ? 'Edit disaster' : 'New disaster'}
      help="Tap the map to place the centre. The ring shows the affected area."
      onBack={onCancel}
      onSubmit={submit}
      onDelete={row ? remove : undefined}
      saving={saving}
      error={error}
      saveLabel={row ? 'Save changes' : 'Save disaster'}
      map={map}
    >
      <TextField label="Title" placeholder="e.g. Flood – North Guwahati" value={title} onChange={setTitle} maxLength={120} required />

      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={DISASTER_TYPES.map((t) => ({ ...t, icon: <Icon name={DISASTER_ICON[t.value]} size={14} /> }))}
      />

      <Segmented
        label="Severity"
        value={severity}
        onChange={setSeverity}
        hint="Low and Moderate show as Watch (amber). High and Severe show as Danger (red)."
        options={SEVERITIES.map((s) => ({
          value: s.value,
          label: s.label,
          tone: s.tone,
          icon: <i className="size-2 rounded-full" style={{ background: s.color }} />,
        }))}
      />

      <RangeField label="Affected radius" value={radius} onChange={setRadius} min={1} max={100} unit="km" />

      <PlaceFields
        state={state}
        district={district}
        auto={autoPlace}
        onState={(v) => (setState(v), setAutoPlace(false))}
        onDistrict={(v) => (setDistrict(v), setAutoPlace(false))}
      />

      <TextArea
        label="What should people know?"
        placeholder="e.g. River level rising near North Guwahati. Avoid low-lying roads."
        value={description}
        onChange={setDescription}
        maxLength={2000}
      />

      <HonestyFields isDemo={isDemo} source={source} onDemo={setIsDemo} onSource={setSource}>
        <Toggle
          label="Show on public map"
          hint={active ? 'People can see this.' : 'Hidden from people.'}
          checked={active}
          onChange={setActive}
        />
      </HonestyFields>
    </FormShell>
  );
}

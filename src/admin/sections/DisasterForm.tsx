import { useState } from 'react';
import type { Disaster } from '../../lib/database.types';
import { useGeo } from '../geo';
import { deleteRow, inNeBox, orNull, saveRow } from '../lib/data';
import { DISASTER_TYPES, SEVERITIES, severityOf } from '../lib/labels';
import { useSaver, type FormProps } from '../lib/useSaver';
import { HonestyFields, PlaceFields } from '../ui/commonFields';
import { Segmented, TextArea, TextField, Toggle } from '../ui/fields';
import { DISASTER_ICONS } from '../ui/icons';
import { FormShell } from '../ui/layout';
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
      () => onDone(row ? 'Disaster updated.' : 'Disaster added. It is now on the public map.'),
    );
  };

  const remove = () =>
    row && void run(() => deleteRow('disasters', row.id), () => onDone('Disaster deleted.'));

  return (
    <FormShell
      title={row ? 'Edit disaster' : 'Add a disaster'}
      onBack={onCancel}
      onSubmit={submit}
      onDelete={row ? remove : undefined}
      saving={saving}
      error={error}
      saveLabel={row ? 'Save changes' : 'Add disaster'}
    >
      <TextField label="Title" placeholder="e.g. Flood – Dhemaji" value={title} onChange={setTitle} maxLength={120} required />

      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={DISASTER_TYPES.map((t) => {
          const Icon = DISASTER_ICONS[t.value];
          return { ...t, icon: <Icon /> };
        })}
      />

      <Segmented
        label="How serious?"
        value={severity}
        onChange={setSeverity}
        options={SEVERITIES.map((s) => ({
          value: s.value,
          label: s.label,
          activeClass: `${s.chip} ${s.value === 'severe' ? '' : 'bg-white/5'}`,
        }))}
      />

      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-200">Where is it?</p>
        <PointPicker
          geo={geo}
          value={point}
          radiusKm={radiusNum}
          color={color}
          onChange={(p, place) => {
            setPoint(p);
            setState(place.state);
            setDistrict(place.district ?? '');
          }}
        />
        {point && (
          <p className="mt-2 text-sm text-slate-400">
            Centre {point.lat.toFixed(4)}, {point.lng.toFixed(4)}. Tap again to move it.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="radius" className="mb-1.5 block text-sm font-semibold text-slate-200">
          Affected area
          <span className="ml-2 font-normal text-slate-500">distance from the centre</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            id="radius"
            type="range"
            min={1}
            max={100}
            step={1}
            value={Math.min(radiusNum || 1, 100)}
            onChange={(e) => setRadius(e.target.value)}
            className="h-12 flex-1"
            style={{ accentColor: color }}
            aria-label="Affected area in kilometres"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={MAX_RADIUS}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-24 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-3 text-right text-base font-bold text-white focus:border-sky-400 focus:outline-none"
              aria-label="Affected area, kilometres"
            />
            <span className="text-base text-slate-300">km</span>
          </div>
        </div>
      </div>

      <PlaceFields state={state} district={district} onState={setState} onDistrict={setDistrict} />

      <TextArea
        label="What is happening?"
        hint="Short, plain words"
        value={description}
        onChange={setDescription}
        maxLength={2000}
      />

      <Toggle
        label="Show on the public map"
        hint={active ? 'People can see this now.' : 'Hidden. Turn on when the alert should go out.'}
        checked={active}
        onChange={setActive}
      />

      <HonestyFields isDemo={isDemo} source={source} onDemo={setIsDemo} onSource={setSource} />
    </FormShell>
  );
}

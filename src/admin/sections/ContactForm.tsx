import { useState } from 'react';
import type { Contact } from '../../lib/database.types';
import { deleteRow, orNull, PHONE_RE, saveRow } from '../lib/data';
import { CONTACT_CATEGORIES } from '../lib/labels';
import { useSaver, type FormProps } from '../lib/useSaver';
import { HonestyFields, PlaceFields } from '../ui/commonFields';
import { SelectField, TextField } from '../ui/fields';
import { FormShell } from '../ui/layout';

export default function ContactForm({ row, onDone, onCancel }: FormProps<Contact>) {
  const { saving, error, setError, run } = useSaver();
  const [name, setName] = useState(row?.name ?? '');
  const [phone, setPhone] = useState(row?.phone ?? '');
  const [category, setCategory] = useState(row?.category ?? 'control_room');
  const [state, setState] = useState(row?.state ?? '');
  const [district, setDistrict] = useState(row?.district ?? '');
  // Contacts are numbers people will really call, so they default to real.
  const [isDemo, setIsDemo] = useState(row?.is_demo ?? false);
  const [source, setSource] = useState(row?.source ?? '');

  const submit = () => {
    if (!name.trim()) return setError('Enter a name, e.g. "Dhemaji district control room".');
    if (!PHONE_RE.test(phone.trim())) {
      return setError('Enter a phone number using digits only (spaces, + and - are fine).');
    }
    if (isDemo && phone.replace(/\D/g, '').length > 6) {
      return setError('Demo contacts must not have a real-looking phone number. Use a short code or make it real.');
    }
    if (!isDemo && !source.trim()) return setError('Real numbers need a source. Add where this number came from.');

    void run(
      () =>
        saveRow('contacts', row?.id ?? null, {
          name: name.trim(),
          phone: phone.trim(),
          category,
          state: orNull(state),
          district: orNull(district),
          is_demo: isDemo,
          source: orNull(source),
        }),
      () => onDone(row ? 'Contact updated.' : 'Contact added.'),
    );
  };

  const remove = () => row && void run(() => deleteRow('contacts', row.id), () => onDone('Contact deleted.'));

  return (
    <FormShell
      title={row ? 'Edit contact' : 'Add a contact'}
      onBack={onCancel}
      onSubmit={submit}
      onDelete={row ? remove : undefined}
      saving={saving}
      error={error}
      saveLabel={row ? 'Save changes' : 'Add contact'}
    >
      <TextField label="Name" placeholder="e.g. Dhemaji district control room" value={name} onChange={setName} maxLength={120} />
      <TextField
        label="Phone number"
        hint="People tap it to call"
        type="tel"
        inputMode="tel"
        placeholder="e.g. 03753 224 001"
        value={phone}
        onChange={setPhone}
        maxLength={20}
      />
      <SelectField label="Type" value={category} onChange={setCategory} options={CONTACT_CATEGORIES} />
      <PlaceFields state={state} district={district} onState={setState} onDistrict={setDistrict} allowAll />
      <HonestyFields isDemo={isDemo} source={source} onDemo={setIsDemo} onSource={setSource} />
    </FormShell>
  );
}

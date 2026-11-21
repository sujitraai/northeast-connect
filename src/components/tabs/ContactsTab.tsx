import type { Contact, ContactCategory, Shelter } from '../../lib/database.types';
import { localContacts, moreNational, nearestShelters } from '../../lib/nearby';
import { kmText } from '../../lib/nearby';
import type { Here } from '../../lib/safety';
import type { IconName } from '../icons';
import { CallRow, LocationPrompt, PlaceRow } from '../lists';
import { GroupTitle, SheetHead } from '../sheet';

/** India's real national helplines: always first, for everyone, no "Demo" tag. Work offline. */
const NATIONAL = [
  { phone: '112', title: 'All emergencies', sub: 'Police, fire, ambulance', icon: 'alert', tile: 'bg-danger-soft text-danger' },
  { phone: '108', title: 'Ambulance', sub: 'Free, 24 × 7', icon: 'cross', tile: 'bg-primary-soft text-primary' },
  { phone: '101', title: 'Fire', sub: 'Fire and rescue', icon: 'flame', tile: 'bg-warn-soft text-warn' },
  { phone: '100', title: 'Police', sub: 'Police control room', icon: 'shield', tile: 'bg-chip text-ink-2' },
] as const;

const CATEGORY: Record<ContactCategory, { icon: IconName; tile: string; label: string }> = {
  emergency: { icon: 'alert', tile: 'bg-danger-soft text-danger', label: 'Emergency' },
  police: { icon: 'shield', tile: 'bg-chip text-ink-2', label: 'Police' },
  ambulance: { icon: 'cross', tile: 'bg-primary-soft text-primary', label: 'Ambulance' },
  fire: { icon: 'flame', tile: 'bg-warn-soft text-warn', label: 'Fire' },
  control_room: { icon: 'bell', tile: 'bg-watch-soft text-watch', label: 'Disaster helpline' },
  hospital: { icon: 'cross', tile: 'bg-safe-soft text-safe', label: 'Hospital' },
};

const SHELTER_KIND = { relief_camp: 'Relief camp', hospital: 'Hospital', shelter: 'Shelter' } as const;

interface Props {
  here: Here | null;
  contacts: Contact[];
  shelters: Shelter[];
  onFind: () => void;
  onChoose: () => void;
  onClose: () => void;
}

/** Contacts tab (feature 8): national numbers, then the person's district, then nearest shelters. */
export default function ContactsTab({ here, contacts, shelters, onFind, onChoose, onClose }: Props) {
  const local = localContacts(contacts, here);
  const extra = moreNational(contacts);
  const places = here ? nearestShelters(here.at, shelters) : [];
  const area = here ? (here.district ?? here.state) : null;
  const from = here?.kind === 'gps' ? here.at : null;

  return (
    <>
      <SheetHead title="Contacts" sub="Tap a green button to call." onClose={onClose} />

      <GroupTitle>National emergency numbers</GroupTitle>
      {NATIONAL.map((n) => (
        <CallRow key={n.phone} {...n} />
      ))}
      {extra.map((c) => (
        <CallRow key={c.id} phone={c.phone} title={c.name} sub="National" {...CATEGORY[c.category]} demo={c.is_demo} />
      ))}

      {!here ? (
        <LocationPrompt onFind={onFind} onChoose={onChoose}>
          Share your location or choose your district to see local numbers and the nearest shelters.
        </LocationPrompt>
      ) : (
        <>
          <GroupTitle>{area} contacts</GroupTitle>
          {local.length === 0 ? (
            <p className="mb-2 rounded-[18px] bg-bg p-3 text-[13px] font-semibold text-muted">
              No local numbers listed for {area} yet. Use the national numbers above.
            </p>
          ) : (
            local.map((c) => (
              <CallRow
                key={c.id}
                phone={c.phone}
                title={c.name}
                sub={CATEGORY[c.category].label}
                icon={CATEGORY[c.category].icon}
                tile={CATEGORY[c.category].tile}
                demo={c.is_demo}
              />
            ))
          )}

          <GroupTitle>Nearest shelters and hospitals</GroupTitle>
          {places.length === 0 && <p className="rounded-[18px] bg-bg p-3 text-[13px] font-semibold text-muted">No shelters listed yet.</p>}
          {places.map(({ item: s, km }) => (
            <PlaceRow
              key={s.id}
              title={s.name}
              sub={[SHELTER_KIND[s.type], kmText(km), s.capacity ? `Space for ${s.capacity}` : null].filter(Boolean).join(' · ')}
              icon={s.type === 'hospital' ? 'cross' : 'tent'}
              tile="bg-safe-soft text-safe"
              to={s}
              from={from}
              phone={s.phone}
              demo={s.is_demo}
            />
          ))}
          {here.kind === 'district' && (
            <p className="mt-1 text-xs font-semibold text-muted">Distances are from the centre of {here.district}.</p>
          )}
        </>
      )}
    </>
  );
}

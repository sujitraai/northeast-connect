import { CONTACT_CATEGORIES, labelOf, place } from '../lib/labels';
import { DemoBadge } from '../ui/bits';
import CrudSection from '../ui/CrudSection';
import { PhoneIcon } from '../ui/icons';
import { Row } from '../ui/layout';
import ContactForm from './ContactForm';

export default function Contacts() {
  return (
    <CrudSection
      table="contacts"
      title="Emergency contacts"
      intro="Numbers people can tap to call. Contacts without a district show everywhere."
      addLabel="Add contact"
      empty="No contacts yet. Add the district control room first."
      Form={ContactForm}
      renderRow={(c, edit) => (
        <Row key={c.id} onClick={edit}>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {labelOf(CONTACT_CATEGORIES, c.category) !== c.name && labelOf(CONTACT_CATEGORIES, c.category)}
            {c.is_demo && <DemoBadge />}
          </div>
          <p className="mt-0.5 truncate text-lg font-bold text-white">{c.name}</p>
          <p className="flex items-center gap-1.5 text-base font-semibold text-sky-200">
            <PhoneIcon />
            {c.phone}
          </p>
          <p className="text-sm text-slate-500">{place(c.district, c.state)}</p>
        </Row>
      )}
    />
  );
}

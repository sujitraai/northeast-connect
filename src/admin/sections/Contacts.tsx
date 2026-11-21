import { CONTACT_CATEGORIES, labelOf, place } from '../lib/labels';
import { TitleCell } from '../ui/cells';
import CrudSection, { type SectionProps } from '../ui/CrudSection';
import ContactForm from './ContactForm';

export default function Contacts({ startNew }: SectionProps) {
  return (
    <CrudSection
      startNew={startNew}
      table="contacts"
      title="Emergency contacts"
      help="Numbers people tap to call. National contacts show to everyone; others only to people in their district (or state)."
      listTitle="All contacts"
      addLabel="Add contact"
      noun="contact"
      empty="No contacts yet. Add the district control room first."
      Form={ContactForm}
      columns={() => [
        {
          header: 'Name',
          cell: (c) => <TitleCell icon="phone" tone="primary" title={c.name} demo={c.is_demo} />,
        },
        {
          header: 'Number',
          cell: (c) => (
            <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="font-extrabold text-ink hover:text-primary">
              {c.phone}
            </a>
          ),
        },
        { header: 'Type', cell: (c) => labelOf(CONTACT_CATEGORIES, c.category) },
        { header: 'Shown to', cell: (c) => (c.is_national ? 'Everyone (national)' : place(c.district, c.state)) },
      ]}
    />
  );
}

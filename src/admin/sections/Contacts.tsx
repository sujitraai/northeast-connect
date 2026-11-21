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
      help="Numbers people can tap to call. Contacts without a district show everywhere."
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
        { header: 'Area', cell: (c) => place(c.district, c.state) },
      ]}
    />
  );
}

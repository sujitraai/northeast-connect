import { labelOf, place, SHELTER_TYPES } from '../lib/labels';
import { TitleCell } from '../ui/cells';
import CrudSection, { type SectionProps } from '../ui/CrudSection';
import ShelterForm from './ShelterForm';

export default function Shelters({ startNew }: SectionProps) {
  return (
    <CrudSection
      startNew={startNew}
      table="shelters"
      title="Shelters and hospitals"
      help="Safe places people are sent to. Each one needs a point on the map."
      listTitle="All shelters"
      addLabel="Add shelter"
      noun="shelter"
      empty="No shelters yet. Add relief camps and hospitals near the danger areas."
      Form={ShelterForm}
      columns={() => [
        {
          header: 'Shelter',
          cell: (s) => (
            <TitleCell icon={s.type === 'hospital' ? 'cross' : 'tent'} tone="safe" title={s.name} demo={s.is_demo} />
          ),
        },
        { header: 'Type', cell: (s) => labelOf(SHELTER_TYPES, s.type) },
        { header: 'District', cell: (s) => place(s.district, s.state) },
        {
          header: 'Space for',
          cell: (s) => (s.capacity != null ? `${s.capacity.toLocaleString('en-IN')} people` : 'Not given'),
        },
      ]}
    />
  );
}

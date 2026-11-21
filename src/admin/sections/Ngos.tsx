import { useRows } from '../lib/data';
import { PublicSwitch, TitleCell } from '../ui/cells';
import CrudSection, { type SectionProps } from '../ui/CrudSection';
import NgoForm from './NgoForm';

export default function Ngos({ startNew }: SectionProps) {
  const disasters = useRows('disasters');
  const titleOf = (id: string) => disasters.rows.find((d) => d.id === id)?.title ?? 'A disaster';

  return (
    <CrudSection
      startNew={startNew}
      table="ngos"
      title="NGOs and help groups"
      help="Groups helping at a disaster site. Link each one to the disaster they are working at."
      listTitle="All groups"
      addLabel="Add group"
      noun="group"
      empty="No groups yet. Add NGOs and volunteers who are helping on the ground."
      sort={(a, b) => Number(b.active) - Number(a.active)}
      faded={(n) => !n.active}
      Form={NgoForm}
      columns={(reload, report) => [
        {
          header: 'Group',
          cell: (n) => <TitleCell icon="users" tone="primary" title={n.name} sub={n.focus} demo={n.is_demo} />,
        },
        {
          header: 'Working at',
          cell: (n) => (n.disaster_id ? titleOf(n.disaster_id) : 'Not linked'),
        },
        { header: 'Map location', cell: (n) => (n.lat == null ? 'None' : 'Set'), mobile: 'hide' },
        {
          header: 'Public',
          cell: (n) => <PublicSwitch table="ngos" id={n.id} active={n.active} onSaved={reload} onError={report} />,
        },
      ]}
    />
  );
}

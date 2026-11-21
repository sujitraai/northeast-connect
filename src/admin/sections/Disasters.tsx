import { DISASTER_ICON } from '../../components/icons';
import type { Disaster } from '../../lib/database.types';
import { place, severityOf, timeAgo } from '../lib/labels';
import { StatusPill } from '../ui/bits';
import { PublicSwitch, TitleCell } from '../ui/cells';
import CrudSection, { type SectionProps } from '../ui/CrudSection';
import type { Column } from '../ui/DataTable';
import DisasterForm from './DisasterForm';

const SEV_ORDER = ['low', 'moderate', 'high', 'severe'];

/** Active first, then most serious. */
export const sortDisasters = (a: Disaster, b: Disaster) =>
  Number(b.active) - Number(a.active) || SEV_ORDER.indexOf(b.severity) - SEV_ORDER.indexOf(a.severity);

/** Columns without the Public switch (used read-only on Overview too). */
export function disasterColumns(): Column<Disaster>[] {
  return [
    {
      header: 'Disaster',
      cell: (d) => (
        <TitleCell icon={DISASTER_ICON[d.type]} tone={severityOf(d.severity).tone} title={d.title} demo={d.is_demo} />
      ),
    },
    { header: 'District', cell: (d) => place(d.district, d.state) },
    {
      header: 'Severity',
      cell: (d) => {
        const s = severityOf(d.severity);
        return <StatusPill tone={s.tone}>{s.label.toUpperCase()}</StatusPill>;
      },
    },
    { header: 'Radius', cell: (d) => `${Number(d.radius_km)} km` },
    { header: 'Updated', cell: (d) => timeAgo(d.updated_at), mobile: 'hide' },
  ];
}

export default function Disasters({ startNew }: SectionProps) {
  return (
    <CrudSection
      startNew={startNew}
      table="disasters"
      title="Disasters"
      help="Add a disaster by tapping the map. Switch off Public to hide it from people."
      listTitle="All disasters"
      addLabel="Add disaster"
      noun="disaster"
      empty="No disasters yet. Add one when a flood, landslide or earthquake is reported."
      sort={sortDisasters}
      faded={(d) => !d.active}
      Form={DisasterForm}
      columns={(reload, report) => {
        const cols = disasterColumns();
        cols.splice(4, 0, {
          header: 'Public',
          cell: (d) => <PublicSwitch table="disasters" id={d.id} active={d.active} onSaved={reload} onError={report} />,
        });
        return cols;
      }}
    />
  );
}

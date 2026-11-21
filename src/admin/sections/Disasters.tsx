import { DISASTER_ICON } from '../../components/icons';
import type { Disaster } from '../../lib/database.types';
import { place, severityOf, timeAgo } from '../lib/labels';
import { StatusPill } from '../ui/bits';
import { PublicSwitch, TitleCell } from '../ui/cells';
import CrudSection, { type SectionProps } from '../ui/CrudSection';
import type { Column } from '../ui/DataTable';
import DisasterForm from './DisasterForm';
import { RadiusCell, SimulateButton } from '../ui/simulate';
import AddNgoButton from '../ui/AddNgoButton';
import DemoPanel from '../ui/DemoPanel';

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
    { header: 'Radius', cell: (d) => <RadiusCell d={d} /> },
    { header: 'Spread', cell: (d) => `${Number(d.spread_kmh ?? 3)} km/h`, mobile: 'hide' },
    { header: 'Updated', cell: (d) => timeAgo(d.updated_at), mobile: 'hide' },
  ];
}

export default function Disasters({ startNew }: SectionProps) {
  return (
    <CrudSection
      startNew={startNew}
      table="disasters"
      title="Disasters"
      help="Public disasters show on the public map within seconds. Simulate grows an area at its spread speed, 60× faster (1 second = 1 minute)."
      listTitle="All disasters"
      addLabel="Add disaster"
      noun="disaster"
      empty="No disasters yet. Add one when a flood, landslide or earthquake is reported."
      sort={sortDisasters}
      faded={(d) => !d.active}
      Form={DisasterForm}
      intro={(report) => <DemoPanel report={report} />}
      rowActions={(d, reload, report) => (
        <>
          <SimulateButton d={d} onDone={reload} onError={report} />
          <AddNgoButton d={d} report={report} />
        </>
      )}
      columns={(reload, report) => {
        const cols = disasterColumns();
        cols.splice(5, 0, {
          header: 'Public',
          cell: (d) => <PublicSwitch table="disasters" id={d.id} active={d.active} onSaved={reload} onError={report} />,
        });
        return cols;
      }}
    />
  );
}

import { Icon, type IconName } from '../../components/icons';
import { useRows, type Counts } from '../lib/data';
import { PrimaryButton } from '../ui/bits';
import DataTable from '../ui/DataTable';
import { ListMessage, PageHeader, Panel } from '../ui/layout';
import { disasterColumns, sortDisasters } from './Disasters';

const KPIS: { key: keyof Counts; label: string; icon: IconName; tile: string; href: string }[] = [
  { key: 'activeDisasters', label: 'Active disasters', icon: 'alert', tile: 'bg-danger-soft text-danger', href: '#disasters' },
  { key: 'shelters', label: 'Shelters', icon: 'tent', tile: 'bg-safe-soft text-safe', href: '#shelters' },
  { key: 'activeNgos', label: 'NGOs active', icon: 'users', tile: 'bg-primary-soft text-primary', href: '#ngos' },
  { key: 'contacts', label: 'Contacts', icon: 'phone', tile: 'bg-watch-soft text-watch', href: '#contacts' },
];

export default function Overview({ counts }: { counts: Counts | null }) {
  const disasters = useRows('disasters');
  const active = disasters.rows.filter((d) => d.active).sort(sortDisasters);

  return (
    <section>
      <PageHeader
        title="Overview"
        help="Everything in the database at a glance."
        actions={
          <PrimaryButton onClick={() => (window.location.hash = 'disasters/new')}>
            <Icon name="plus" size={16} />
            Add disaster
          </PrimaryButton>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-3.5">
        {KPIS.map((k) => (
          <a key={k.key} href={k.href} className="flex items-center gap-3.5 rounded-inner bg-white p-4 hover:ring-2 hover:ring-line">
            <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] ${k.tile}`}>
              <Icon name={k.icon} size={20} />
            </span>
            <span className="min-w-0">
              <b className="block text-2xl font-extrabold tracking-[-0.02em] text-ink">{counts ? counts[k.key] : '–'}</b>
              <span className="text-[12.5px] font-bold text-muted">{k.label}</span>
            </span>
          </a>
        ))}
      </div>

      <Panel title="Active disasters" side={<a href="#disasters" className="text-[13px] font-bold text-primary">Manage disasters</a>}>
        {disasters.loading && active.length === 0 ? (
          <ListMessage>Loading…</ListMessage>
        ) : active.length === 0 ? (
          <ListMessage>No active disasters right now.</ListMessage>
        ) : (
          <DataTable rows={active} columns={disasterColumns()} />
        )}
      </Panel>
    </section>
  );
}

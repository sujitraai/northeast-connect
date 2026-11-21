import { useRows } from '../lib/data';
import { DemoBadge } from '../ui/bits';
import CrudSection from '../ui/CrudSection';
import { Row } from '../ui/layout';
import NgoForm from './NgoForm';

export default function Ngos() {
  const disasters = useRows('disasters');
  const titleOf = (id: string) => disasters.rows.find((d) => d.id === id)?.title ?? 'a disaster';

  return (
    <CrudSection
      table="ngos"
      title="NGOs and help groups"
      intro="Groups helping at a disaster site. Link each one to the disaster they are working at."
      addLabel="Add group"
      empty="No groups yet. Add NGOs and volunteers who are helping on the ground."
      sort={(a, b) => Number(b.active) - Number(a.active)}
      Form={NgoForm}
      renderRow={(n, edit) => (
        <Row key={n.id} onClick={edit}>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {n.active ? 'Active' : 'Not active'}
            {n.is_demo && <DemoBadge />}
          </div>
          <p className={`mt-0.5 truncate text-lg font-bold ${n.active ? 'text-white' : 'text-slate-500'}`}>{n.name}</p>
          {n.focus && <p className="truncate text-sm text-slate-400">{n.focus}</p>}
          <p className="text-sm text-slate-500">
            {n.disaster_id ? `Working at: ${titleOf(n.disaster_id)}` : 'Not linked to a disaster'}
            {n.lat == null && ', no map location'}
          </p>
        </Row>
      )}
    />
  );
}

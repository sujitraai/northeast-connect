import { labelOf, place, SHELTER_TYPES } from '../lib/labels';
import { DemoBadge } from '../ui/bits';
import CrudSection from '../ui/CrudSection';
import { Row } from '../ui/layout';
import ShelterForm from './ShelterForm';

export default function Shelters() {
  return (
    <CrudSection
      table="shelters"
      title="Shelters and hospitals"
      intro="Safe places people are sent to. Each one needs a point on the map."
      addLabel="Add shelter"
      empty="No shelters yet. Add relief camps and hospitals near the danger areas."
      Form={ShelterForm}
      renderRow={(s, edit) => (
        <Row key={s.id} onClick={edit}>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {labelOf(SHELTER_TYPES, s.type)}
            {s.is_demo && <DemoBadge />}
          </div>
          <p className="mt-0.5 truncate text-lg font-bold text-white">{s.name}</p>
          <p className="text-sm text-slate-400">
            {place(s.district, s.state)}
            {s.capacity != null && `, room for ${s.capacity.toLocaleString('en-IN')}`}
          </p>
        </Row>
      )}
    />
  );
}

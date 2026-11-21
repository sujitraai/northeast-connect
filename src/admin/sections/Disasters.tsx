import { labelOf, DISASTER_TYPES, formatDate, place, severityOf } from '../lib/labels';
import { DemoBadge } from '../ui/bits';
import CrudSection from '../ui/CrudSection';
import { DISASTER_ICONS } from '../ui/icons';
import { Row } from '../ui/layout';
import DisasterForm from './DisasterForm';

export default function Disasters() {
  return (
    <CrudSection
      table="disasters"
      title="Disasters"
      intro="Active disasters appear on the public map as a danger zone. Tap one to change or remove it."
      addLabel="Add disaster"
      empty="No disasters yet. Add one when a flood, landslide or earthquake is reported."
      // Shown first: active ones, then most serious.
      sort={(a, b) =>
        Number(b.active) - Number(a.active) ||
        SEV_ORDER.indexOf(b.severity) - SEV_ORDER.indexOf(a.severity)
      }
      Form={DisasterForm}
      renderRow={(d, edit) => {
        const sev = severityOf(d.severity);
        const Icon = DISASTER_ICONS[d.type];
        return (
          <Row key={d.id} onClick={edit} accent={d.active ? sev.color : '#334155'}>
            <div className="flex items-center gap-2 text-slate-400">
              <Icon />
              <span className="text-sm">{labelOf(DISASTER_TYPES, d.type)}</span>
              <span className={`rounded-md border px-1.5 py-0.5 text-xs font-bold ${sev.chip}`}>{sev.label}</span>
              {d.is_demo && <DemoBadge />}
            </div>
            <p className={`mt-1 truncate text-lg font-bold ${d.active ? 'text-white' : 'text-slate-500'}`}>{d.title}</p>
            <p className="text-sm text-slate-400">
              {place(d.district, d.state)}, {Number(d.radius_km)} km around
            </p>
            <p className="text-sm text-slate-500">
              {d.active ? 'On the public map' : 'Hidden from the public'}. Added {formatDate(d.created_at)}
            </p>
          </Row>
        );
      }}
    />
  );
}

const SEV_ORDER = ['low', 'moderate', 'high', 'severe'];

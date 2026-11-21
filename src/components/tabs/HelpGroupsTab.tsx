import type { GroupNearby } from '../../lib/nearby';
import type { Here } from '../../lib/safety';
import { Icon } from '../icons';
import { GroupCard, LocationPrompt } from '../lists';
import { SheetHead } from '../sheet';

interface Props {
  here: Here | null;
  groups: GroupNearby[];
  onFind: () => void;
  onChoose: () => void;
  onClose: () => void;
}

/** Help groups tab (feature 9): groups within 30 km or at a nearby disaster, nearest first. */
export default function HelpGroupsTab({ here, groups, onFind, onChoose, onClose }: Props) {
  const from = here?.kind === 'gps' ? here.at : null;
  return (
    <>
      <SheetHead title="Help groups" sub="Volunteers and NGOs helping near you." onClose={onClose} />

      {!here ? (
        <LocationPrompt onFind={onFind} onChoose={onChoose}>
          Share your location or choose your district to see help groups near you.
        </LocationPrompt>
      ) : groups.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-inner bg-bg px-6 py-8 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-white text-ink-2 shadow-soft">
            <Icon name="users" size={26} />
          </div>
          <p className="mt-4 text-base font-extrabold text-ink">No help groups near you yet</p>
          <a
            href="tel:112"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-btn bg-danger px-5 text-[15px] font-extrabold text-white active:scale-[0.98]"
          >
            <Icon name="phone" size={18} />
            Call 112
          </a>
        </div>
      ) : (
        <>
          <p className="mt-1 mb-3 text-[12.5px] font-semibold text-muted">
            {groups.length} group{groups.length === 1 ? '' : 's'} within 30 km or at a disaster near you
            {here.kind === 'district' ? ` (distances from the centre of ${here.district})` : ''}. Blue pins on the map.
          </p>
          {groups.map((g, i) => (
            <GroupCard key={g.item.id} group={g.item} km={g.km} at={g.disaster?.title ?? null} from={from} index={i} />
          ))}
        </>
      )}
    </>
  );
}

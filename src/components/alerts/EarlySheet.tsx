import { GUIDANCE } from '../../lib/guidance';
import type { LatLng, Nearest } from '../../lib/safety';
import type { ShelterPick } from '../../lib/shelters';
import { Icon } from '../icons';
import { GroupTitle } from '../sheet';
import { RouteButtons, ShelterCard } from './ShelterActions';

interface Props {
  lead: Nearest;
  pick: ShelterPick | null;
  from: LatLng | null;
  routeOn: boolean;
  onRoute: () => void;
  onFamily: () => void;
}

/** Map sheet during an Early warning (reference screen 2b). */
export default function EarlySheet({ lead, pick, from, routeOn, onRoute, onFamily }: Props) {
  const g = GUIDANCE[lead.disaster.type];
  return (
    <>
      <GroupTitle>Go to a safe place now</GroupTitle>
      <ShelterCard pick={pick} disaster={lead.disaster} />
      {pick && <RouteButtons pick={pick} from={from} routeOn={routeOn} onRoute={onRoute} />}

      <ul aria-label={`What to do in a ${g.name.toLowerCase()}`} className="-mx-4 my-2.5 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        {g.todo.map((t) => (
          <li key={t} className="shrink-0 rounded-xl bg-bg px-2.5 py-1.5 text-[12.5px] font-bold whitespace-nowrap text-ink-2">
            {t}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-2">
        <a
          href="tel:112"
          className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-danger text-sm font-extrabold text-white active:scale-[0.98]"
        >
          <Icon name="phone" size={16} />
          Call 112
        </a>
        <button
          type="button"
          onClick={onFamily}
          className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-white text-sm font-extrabold text-ink ring-2 ring-line ring-inset active:scale-[0.98]"
        >
          <Icon name="users" size={16} />
          Alert family
        </button>
      </div>
    </>
  );
}

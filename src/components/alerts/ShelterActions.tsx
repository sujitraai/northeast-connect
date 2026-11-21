import type { Disaster } from '../../lib/database.types';
import { GUIDANCE } from '../../lib/guidance';
import { formatKm, type LatLng } from '../../lib/safety';
import { mapsLink, walkText, type ShelterPick } from '../../lib/shelters';
import { Icon } from '../icons';

const SHELTER_KIND = { relief_camp: 'Relief camp', hospital: 'Hospital', shelter: 'Shelter' } as const;

/** Green "Go to a safe place now" card (reference "go-card"). */
export function ShelterCard({ pick, disaster }: { pick: ShelterPick | null; disaster: Disaster }) {
  if (!pick) {
    return (
      <div className="mb-2.5 rounded-inner bg-bg p-3 text-[13.5px] leading-snug font-semibold text-ink-2">
        No shelter is listed outside the {GUIDANCE[disaster.type].name.toLowerCase()} area yet. Call 112 for help to
        reach a safe place.
      </div>
    );
  }
  const s = pick.shelter;
  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-inner bg-safe-soft p-3">
      <span className="grid size-[46px] shrink-0 place-items-center rounded-[15px] bg-white text-safe">
        <Icon name={s.type === 'hospital' ? 'cross' : 'tent'} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-snug font-extrabold text-ink">{s.name}</b>
        <span className="text-[12.5px] font-semibold text-ink-2">
          {SHELTER_KIND[s.type]} · {formatKm(pick.km)} · {walkText(pick.walkMin)} · outside the{' '}
          {GUIDANCE[disaster.type].name.toLowerCase()}
          {s.is_demo && ' · Demo data'}
        </span>
      </span>
    </div>
  );
}

/** "Start route" (dotted line on the map) + "Google Maps" (real roads). */
export function RouteButtons({
  pick,
  from,
  routeOn,
  onRoute,
}: {
  pick: ShelterPick;
  /** null in district mode: no exact start point, so no line; Google Maps uses the phone's location. */
  from: LatLng | null;
  routeOn: boolean;
  onRoute: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {from ? (
          <button
            type="button"
            onClick={onRoute}
            className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-navy text-sm font-extrabold text-white active:scale-[0.98]"
          >
            <Icon name="nav" size={16} />
            {routeOn ? 'Hide route' : 'Start route'}
          </button>
        ) : null}
        <a
          href={mapsLink(from, pick.shelter)}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-12 items-center justify-center gap-2 rounded-[15px] bg-bg text-sm font-extrabold text-ink active:scale-[0.98] ${from ? '' : 'col-span-2'}`}
        >
          <Icon name="map" size={16} />
          Google Maps
        </a>
      </div>
      {routeOn && (
        <p className="mt-1.5 text-xs font-semibold text-muted">
          The dotted line shows the direction. Google Maps shows the roads.
        </p>
      )}
    </>
  );
}

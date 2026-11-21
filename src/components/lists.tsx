import type { ReactNode } from 'react';
import type { Ngo } from '../lib/database.types';
import { directionsHref, kmText, telHref } from '../lib/nearby';
import { offerChips } from '../lib/offers';
import type { LatLng } from '../lib/safety';
import { Icon, type IconName } from './icons';

/** Small grey "Demo data" text pill. */
export function DemoTag() {
  return <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">Demo data</span>;
}

/** One-tap call row (reference "row"): the whole row is the call link. */
export function CallRow({
  phone,
  title,
  sub,
  icon,
  tile,
  demo,
}: {
  phone: string;
  title: string;
  sub?: string;
  icon: IconName;
  tile: string;
  demo?: boolean;
}) {
  return (
    <a
      href={telHref(phone)}
      aria-label={`Call ${phone}, ${title}`}
      className="mb-2 flex items-center gap-3 rounded-[18px] bg-bg p-2.5 active:scale-[0.99]"
    >
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[14px] ${tile}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-snug font-extrabold text-ink">{title}</b>
        <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-muted">
          {sub}
          {demo && <DemoTag />}
        </span>
      </span>
      <span className="mr-1 text-base font-extrabold text-ink">{phone}</span>
      <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-safe text-white">
        <Icon name="phone" size={18} />
      </span>
    </a>
  );
}

/** A place (shelter / hospital) with distance and a blue directions button. */
export function PlaceRow({
  title,
  sub,
  icon,
  tile,
  to,
  from,
  phone,
  demo,
}: {
  title: string;
  sub: string;
  icon: IconName;
  tile: string;
  to: LatLng;
  from: LatLng | null;
  phone?: string | null;
  demo?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-[18px] bg-bg p-2.5">
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[14px] ${tile}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-snug font-extrabold text-ink">{title}</b>
        <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-muted">
          {sub}
          {demo && <DemoTag />}
        </span>
      </span>
      {phone && (
        <a href={telHref(phone)} aria-label={`Call ${title}`} className="grid size-[42px] shrink-0 place-items-center rounded-full bg-safe text-white">
          <Icon name="phone" size={18} />
        </a>
      )}
      <a
        href={directionsHref(from, to)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Directions to ${title} in Google Maps`}
        className="grid size-[42px] shrink-0 place-items-center rounded-full bg-primary text-white"
      >
        <Icon name="nav" size={18} />
      </a>
    </div>
  );
}

const LOGO = ['bg-primary', 'bg-[#0EA5A4]', 'bg-[#7C3AED]', 'bg-[#DB2777]', 'bg-[#0F766E]'];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Help group card (reference screen 5): logo, name, distance, offer chips, Call + Directions. */
export function GroupCard({
  group,
  km,
  at,
  from,
  index,
}: {
  group: Ngo;
  km: number;
  /** Where the group is working (e.g. the disaster title). */
  at: string | null;
  from: LatLng | null;
  index: number;
}) {
  const chips = offerChips(group.focus);
  const where = group.lat != null && group.lng != null ? { lat: group.lat, lng: group.lng } : null;
  return (
    <article className="mb-2.5 rounded-inner bg-bg p-3.5">
      <div className="flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] text-[15px] font-extrabold text-white ${LOGO[index % LOGO.length]}`}>
          {initials(group.name)}
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] leading-snug font-extrabold text-ink">{group.name}</b>
          <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-muted">
            {[at ? `At ${at}` : null, Number.isFinite(km) ? kmText(km) : null].filter(Boolean).join(' · ')}
            {group.is_demo && <DemoTag />}
          </span>
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="my-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li key={c} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-ink-2">
              {c}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2.5 flex gap-2">
        {group.phone ? (
          <a href={telHref(group.phone)} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-safe text-sm font-extrabold text-white">
            <Icon name="phone" size={16} />
            Call
          </a>
        ) : (
          <span className="flex h-11 flex-1 items-center justify-center rounded-[14px] bg-white/60 text-[12.5px] font-bold text-muted">
            No phone listed
          </span>
        )}
        {where && (
          <a
            href={directionsHref(from, where)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-white text-sm font-extrabold text-ink"
          >
            <Icon name="nav" size={16} />
            Directions
          </a>
        )}
      </div>
    </article>
  );
}

/** Asks for a location when the tab needs one. */
export function LocationPrompt({ children, onFind, onChoose }: { children: ReactNode; onFind: () => void; onChoose: () => void }) {
  return (
    <div className="mt-3 rounded-inner bg-primary-soft p-3.5">
      <p className="text-[13.5px] leading-snug font-semibold text-navy">{children}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" onClick={onFind} className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-3.5 text-sm font-extrabold text-white">
          <Icon name="locate" size={16} />
          Find me
        </button>
        <button type="button" onClick={onChoose} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-extrabold text-ink">
          <Icon name="pin" size={16} />
          Choose district
        </button>
      </div>
    </div>
  );
}

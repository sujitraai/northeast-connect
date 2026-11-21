import type { Contact, Disaster, Ngo, Shelter } from './database.types';
import { assess, distanceKm, type Here, type LatLng, type Nearest } from './safety';

/** Help groups this close are always shown. */
export const GROUP_RADIUS_KM = 30;

/** The 4 national numbers shown first to everyone (also hard-coded, so they work offline). */
export const NATIONAL_FIRST = ['112', '108', '101', '100'];

export interface WithKm<T> {
  item: T;
  km: number;
}

const byKm = <T>(a: WithKm<T>, b: WithKm<T>) => a.km - b.km;

/** National = for everyone. (Before 08_live_help.sql the flag is missing: use the seed's source.) */
const isNational = (c: Contact) => c.is_national ?? c.source === 'National helpline (India)';

/** National contacts not already in the fixed first four (e.g. 1070, 1077). */
export function moreNational(contacts: Contact[]): Contact[] {
  return contacts.filter((c) => isNational(c) && !NATIONAL_FIRST.includes(c.phone.replace(/\s/g, '')));
}

/**
 * Contacts for where the person is: their district, or their whole state when
 * a contact has no district. Contacts with no area at all (all North East) too.
 */
export function localContacts(contacts: Contact[], here: Here | null): Contact[] {
  if (!here) return [];
  return contacts.filter((c) => {
    if (isNational(c)) return false;
    if (!c.state && !c.district) return true;
    if (c.state && c.state !== here.state) return false;
    return !c.district || c.district === here.district;
  });
}

/** Nearest shelters / hospitals first. */
export function nearestShelters(from: LatLng, shelters: Shelter[], limit = 6): WithKm<Shelter>[] {
  return shelters
    .map((s) => ({ item: s, km: distanceKm(from, s) }))
    .sort(byKm)
    .slice(0, limit);
}

export interface GroupNearby extends WithKm<Ngo> {
  /** The nearby active disaster it is working at, if any. */
  disaster: Disaster | null;
}

/**
 * Help groups within 30 km, or working at an active disaster whose area is
 * within 30 km. Nearest first. Groups with no map location only show through
 * their disaster (distance = to the disaster).
 */
export function nearbyGroups(here: Here, ngos: Ngo[], disasters: Disaster[]): GroupNearby[] {
  const near = new Map<string, Nearest>();
  for (const d of disasters) {
    const t = assess(here, [d]).nearest;
    if (t && t.edgeKm <= GROUP_RADIUS_KM) near.set(d.id, t);
  }
  const out: GroupNearby[] = [];
  for (const g of ngos) {
    const linked = g.disaster_id ? (near.get(g.disaster_id) ?? null) : null;
    const km = g.lat != null && g.lng != null ? distanceKm(here.at, { lat: g.lat, lng: g.lng }) : linked ? distanceKm(here.at, linked.disaster) : Infinity;
    if (km <= GROUP_RADIUS_KM || linked) out.push({ item: g, km, disaster: linked?.disaster ?? null });
  }
  return out.sort(byKm);
}

/** District control room for the person's district; otherwise the national 1077 line. */
export function controlRoom(contacts: Contact[], here: Here | null): { name: string; phone: string; isDemo: boolean } {
  const local = localContacts(contacts, here).find((c) => c.category === 'control_room' && c.district);
  if (local) return { name: local.name, phone: local.phone, isDemo: local.is_demo };
  return { name: 'District disaster control room', phone: '1077', isDemo: false };
}

/** Phone number as a tel: link (digits and + only). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Google Maps directions to a place (from `from` if known, otherwise the phone's location). */
export function directionsHref(from: LatLng | null, to: LatLng): string {
  const origin = from ? `&origin=${from.lat},${from.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${to.lat},${to.lng}`;
}

/** "1.8 km" / "800 m" for list rows. */
export function kmText(km: number): string {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(100, Math.round(km * 10) * 100)} m`;
  return `${km < 10 ? km.toFixed(1).replace(/\.0$/, '') : Math.round(km)} km`;
}

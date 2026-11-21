import type { TopCardContent } from '../components/TopCard';
import type { LiveMap } from '../hooks/useLiveMap';
import type { DisasterType } from './database.types';
import { formatKm, type Here, type Safety } from './safety';

/** Which button the top card shows. */
export type CardAction = 'none' | 'retry' | 'find' | 'choose' | 'find-or-choose';

export interface CardInput {
  mapFailed: boolean;
  tappedDistrict: { district: string; state: string } | null;
  here: Here | null;
  /** GPS worked but the point is outside the 8 NE states. */
  outside: boolean;
  locationDenied: boolean;
  locateError: string | null;
  live: LiveMap;
  safety: Safety | null;
}

const NEUTRAL = { mood: 'safe', tone: 'neutral' } as const;

const WORD: Record<DisasterType, string> = {
  flood: 'flood',
  landslide: 'landslide',
  earthquake: 'earthquake',
  other: 'disaster',
};

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** What the top card says right now, and which button it shows. */
export function topCardFor(i: CardInput): { card: TopCardContent; action: CardAction; closable?: boolean } {
  if (i.mapFailed) {
    return {
      card: { ...NEUTRAL, greet: 'Northeast Connect', headline: 'The map did not fully load', bubble: 'Check your internet connection, then try again.' },
      action: 'retry',
    };
  }
  if (i.tappedDistrict) {
    return {
      card: { ...NEUTRAL, greet: 'District', headline: i.tappedDistrict.district, bubble: i.tappedDistrict.state },
      action: 'none',
      closable: true,
    };
  }
  if (i.here) return { card: hereCard(i.here, i.live, i.safety), action: 'none' };
  if (i.outside) {
    return {
      card: {
        ...NEUTRAL,
        greet: greeting(),
        headline: "You're outside North East India",
        bubble: 'This app covers the 8 North East states. Choose a district to check one.',
      },
      action: 'choose',
    };
  }
  if (i.locationDenied) {
    return {
      card: { ...NEUTRAL, greet: 'Location is off', headline: 'Choose your district', bubble: 'Pick your district and I’ll check for danger near it.' },
      action: 'choose',
    };
  }
  if (i.locateError) {
    return { card: { ...NEUTRAL, greet: greeting(), headline: 'Cannot find your location', bubble: i.locateError }, action: 'find-or-choose' };
  }
  return {
    card: {
      ...NEUTRAL,
      greet: greeting(),
      headline: 'Welcome to Northeast Connect',
      bubble: 'Find where you are, or choose your district, to check for danger near you.',
    },
    action: 'find-or-choose',
  };
}

function hereCard(here: Here, live: LiveMap, safety: Safety | null): TopCardContent {
  const area = here.district ?? here.state;
  const place = here.district ? `${here.district} · ${here.state}` : here.state;

  if (live.status === 'off' || !live.loaded || !safety || (live.error && !live.updatedAt)) {
    const bubble =
      live.status === 'off'
        ? 'Danger checks are not connected yet.'
        : live.error
          ? 'Could not check for danger. Check your internet connection.'
          : 'Checking for danger near you…';
    return { ...NEUTRAL, greet: place, headline: `You're in ${area}`, bubble };
  }

  const n = safety.lead ?? safety.nearest;
  if (safety.level === 'safe' || !n) {
    return {
      mood: 'safe',
      tone: 'safe',
      greet: here.kind === 'gps' ? greeting() : `${place} (chosen)`,
      headline: `You're safe in ${area}`,
      bubble: `No disaster within 25 km${here.kind === 'gps' ? ' of you' : ''} right now. I'll update this if anything changes.`,
    };
  }

  const word = WORD[n.disaster.type];
  // Early warning / Danger normally show the orange banner or red screen
  // instead of this card; this is the fallback text.
  if (safety.level === 'early' || safety.level === 'danger') {
    return {
      mood: safety.level === 'early' ? 'scared' : 'danger',
      tone: safety.level === 'early' ? 'warn' : 'danger',
      greet: place,
      headline: n.inside ? `You're inside a ${word} area` : `${word[0].toUpperCase()}${word.slice(1)} coming towards you`,
      bubble: `${n.disaster.title}. Move to a safe place if you can. Tap “Get help now” for emergency numbers.`,
      demo: n.disaster.is_demo,
    };
  }

  const where =
    n.edgeKm === 0
      ? `${n.disaster.title} reaches ${here.kind === 'gps' ? 'your area' : 'your district'}.`
      : `${n.disaster.title} is ${formatKm(n.edgeKm)} ${n.direction} of ${here.kind === 'gps' ? 'you' : area}.`;
  return {
    mood: 'watch',
    tone: 'watch',
    greet: place,
    headline: `Stay alert — ${word} nearby`,
    bubble: `${where} Keep your phone charged.`,
    demo: n.disaster.is_demo,
  };
}

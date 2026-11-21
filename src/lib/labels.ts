import type { DisasterType, Severity } from './database.types';

export const DISASTER_TYPES: { value: DisasterType; label: string }[] = [
  { value: 'flood', label: 'Flood' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'other', label: 'Other' },
];

/** Colour = meaning: low/moderate are "Watch" (amber), high/severe are "Danger" (red). */
export type Tone = 'watch' | 'danger';
export const TONE_HEX: Record<Tone, string> = { watch: '#D97706', danger: '#DC2626' };
export const SEVERITIES: { value: Severity; label: string; tone: Tone; color: string }[] = [
  { value: 'low', label: 'Low', tone: 'watch', color: TONE_HEX.watch },
  { value: 'moderate', label: 'Moderate', tone: 'watch', color: TONE_HEX.watch },
  { value: 'high', label: 'High', tone: 'danger', color: TONE_HEX.danger },
  { value: 'severe', label: 'Severe', tone: 'danger', color: TONE_HEX.danger },
];
export const severityOf = (s: Severity) => SEVERITIES.find((x) => x.value === s)!;

/** "10 min ago", "3 hrs ago", or a date for anything older than a week. */
export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso: string) => DATE.format(new Date(iso));


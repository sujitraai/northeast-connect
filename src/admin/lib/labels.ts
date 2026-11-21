import type {
  ContactCategory,
  DisasterType,
  Severity,
  ShelterType,
} from '../../lib/database.types';
import { STATE_LABELS } from '../../config/region';

export const NE_STATES = STATE_LABELS.map((s) => s.name).sort();

export const DISASTER_TYPES: { value: DisasterType; label: string }[] = [
  { value: 'flood', label: 'Flood' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'other', label: 'Other' },
];

/** Colour = meaning: low/moderate are "Watch" (amber), high/severe are "Danger" (red). */
export const SEVERITIES: { value: Severity; label: string; color: string; chip: string }[] = [
  { value: 'low', label: 'Low', color: '#fcd34d', chip: 'border-amber-300/50 text-amber-200' },
  { value: 'moderate', label: 'Moderate', color: '#f59e0b', chip: 'border-amber-500/70 text-amber-300' },
  { value: 'high', label: 'High', color: '#ef4444', chip: 'border-red-500/70 text-red-300' },
  { value: 'severe', label: 'Severe', color: '#dc2626', chip: 'border-red-500 bg-red-600 text-white' },
];
export const severityOf = (s: Severity) => SEVERITIES.find((x) => x.value === s)!;

export const CONTACT_CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: 'emergency', label: 'Emergency (all services)' },
  { value: 'police', label: 'Police' },
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'fire', label: 'Fire' },
  { value: 'control_room', label: 'Control room' },
  { value: 'hospital', label: 'Hospital' },
];

export const SHELTER_TYPES: { value: ShelterType; label: string }[] = [
  { value: 'relief_camp', label: 'Relief camp' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'shelter', label: 'Shelter' },
];

export const labelOf = <V extends string>(list: { value: V; label: string }[], v: V) =>
  list.find((x) => x.value === v)?.label ?? v;

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso: string) => DATE.format(new Date(iso));

export const place = (district: string | null, state: string | null) =>
  [district, state].filter(Boolean).join(', ') || 'All of North East India';

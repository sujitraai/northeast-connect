import type { ContactCategory, ShelterType } from '../../lib/database.types';
import { STATE_LABELS } from '../../config/region';

// Shared with the public map.
export { DISASTER_TYPES, formatDate, SEVERITIES, severityOf, timeAgo, TONE_HEX, type Tone } from '../../lib/labels';

export const NE_STATES = STATE_LABELS.map((s) => s.name).sort();

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

export const place = (district: string | null, state: string | null) =>
  [district, state].filter(Boolean).join(', ') || 'All of North East India';

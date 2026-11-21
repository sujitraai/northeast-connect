import type { DisasterType } from './database.types';

export interface Guidance {
  /** Word used in banners: "FLOOD", "Flood may reach you…" */
  name: string;
  /** Big instruction on the Danger screen. */
  instruction: string;
  /** "Do this now": exactly three steps, in order. */
  steps: [string, string, string];
  /** Short to-do chips on the Early warning sheet. */
  todo: string[];
}

/** Plain-words advice for each disaster type. */
export const GUIDANCE: Record<DisasterType, Guidance> = {
  flood: {
    name: 'Flood',
    instruction: 'Move to higher ground',
    steps: ['Go to the nearest shelter or higher ground', 'Carry ID, medicines and your phone', 'Switch off the main electricity'],
    todo: ['🎒 ID & medicines', '⚡ Power off', '👵 Help elders', '⛰️ Go uphill'],
  },
  landslide: {
    name: 'Landslide',
    instruction: 'Move away from the slope',
    steps: ['Leave homes on or below the slope now', 'Stay away from the path of mud and rocks', 'Keep away from river banks and valleys'],
    todo: ['🏃 Leave the slope', '🪨 Watch for cracks', '🌊 Avoid river banks', '👵 Help elders'],
  },
  earthquake: {
    name: 'Earthquake',
    instruction: 'Drop, cover and hold on',
    steps: ['Get under a strong table and hold on', 'Stay away from windows and heavy things', 'When shaking stops, go to open ground'],
    todo: ['🛡️ Drop, cover, hold', '🪟 Away from glass', '🌳 Open ground', '🔥 Gas off'],
  },
  other: {
    name: 'Disaster',
    instruction: 'Move to a safe place',
    steps: ['Go to the nearest shelter', 'Carry ID, medicines and your phone', 'Follow instructions from officials'],
    todo: ['🎒 ID & medicines', '🔋 Charge phone', '👵 Help elders'],
  },
};

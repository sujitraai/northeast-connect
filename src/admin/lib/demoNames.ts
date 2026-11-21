/**
 * Made-up, local-sounding names for demo help groups and shelters.
 * None of these are real organisations; every row made with them is marked
 * "Demo data" in the app.
 */
export const GROUP_NAMES = [
  'Brahmaputra Boat Rescue',
  'Majuli Relief Volunteers',
  'Kamrup Food Bank',
  'Hills First Aid Team',
  'Dihing River Rescue',
  'Subansiri Relief Group',
  'Kopili Help Network',
  'Lohit Youth Volunteers',
  'Manas Community Kitchen',
  'Siang Valley Rescue',
  'Jia Bharali Volunteers',
  'Barak Valley Helpers',
  'Dhansiri Relief Team',
  'Umiam Hill Rescuers',
];

export const SHELTER_NAMES = [
  'Namghar Relief Camp',
  'Govt. HS School Camp',
  'Panchayat Bhawan Shelter',
  'District Sports Complex Camp',
  'Community Hall Shelter',
  'Govt. LP School Camp',
  'Block Office Relief Camp',
  'College Auditorium Shelter',
  'Town Club Shelter',
  'Satra Prayer Hall Camp',
  'Village Council Hall',
  'Higher Secondary School Camp',
];

/** What demo help groups offer, by disaster type (first set, second set). */
export const OFFERS: Record<'flood' | 'landslide' | 'earthquake' | 'other', [string, string]> = {
  flood: ['rescue boats, food packets', 'food packets, drinking water, life jackets'],
  landslide: ['first aid, digging team', 'digging team, stretchers, blankets'],
  earthquake: ['first aid, search team', 'tents, blankets, drinking water'],
  other: ['first aid, food packets', 'drinking water, blankets'],
};

/** `count` different random items from a list. */
export function pickSome<T>(list: readonly T[], count: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (out.length < count && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

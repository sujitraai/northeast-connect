/** Emoji for what a help group offers, matched by keyword (first match wins). */
const EMOJI: [RegExp, string][] = [
  [/boat/i, '🚤'],
  [/life ?jacket/i, '🦺'],
  [/food|meal|kitchen|rice/i, '🍚'],
  [/water/i, '💧'],
  [/first aid|medic|doctor|health/i, '🩺'],
  [/dig|clear|road/i, '⛏️'],
  [/stretcher|rescue|search/i, '🧭'],
  [/blanket|cloth/i, '🧣'],
  [/tent|shelter|camp/i, '⛺'],
  [/kit/i, '🎒'],
  [/volunteer|people/i, '👥'],
  [/transport|vehicle/i, '🚐'],
];

/** "rescue boats, food packets" → ["🚤 Rescue boats", "🍚 Food packets"]. */
export function offerChips(focus: string | null): string[] {
  if (!focus) return [];
  return focus
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      // Text that already starts with an emoji is kept as it is.
      if (/^\p{Extended_Pictographic}/u.test(s)) return s;
      const emoji = EMOJI.find(([re]) => re.test(s))?.[1] ?? '✅';
      return `${emoji} ${s[0].toUpperCase()}${s.slice(1)}`;
    });
}

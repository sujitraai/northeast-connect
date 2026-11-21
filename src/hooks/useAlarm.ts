import { useCallback, useEffect, useRef, useState } from 'react';
import type { SafetyLevel } from '../lib/safety';
import { notify, startSiren, stopSiren } from '../lib/siren';

const RANK: Record<SafetyLevel, number> = { safe: 0, watch: 1, early: 2, danger: 3 };

interface Options {
  level: SafetyLevel;
  /** The person turned alerts on (siren, vibration, notification). */
  enabled: boolean;
  /** Notification text for the current level (read when the alarm fires). */
  title: string;
  body: string;
}

/**
 * Loud alert when the level RISES to Early warning or Danger: siren (loops
 * until muted), vibration and a notification. Fires once per rise; staying
 * at the same level, or dropping, does not fire it again.
 */
export function useAlarm({ level, enabled, title, body }: Options) {
  const [sounding, setSounding] = useState(false);
  const lastRank = useRef(RANK.safe);
  const text = useRef({ title, body });
  text.current = { title, body };

  useEffect(() => {
    const rank = RANK[level];
    const rose = rank > lastRank.current;
    lastRank.current = rank;

    if (rank < RANK.early) {
      stopSiren();
      setSounding(false);
      return;
    }
    if (!rose || !enabled) return;
    setSounding(startSiren());
    void notify(text.current.title, text.current.body, `nec-${level}`);
  }, [level, enabled]);

  useEffect(() => () => stopSiren(), []);

  /** "Tap to mute" — or, when silent, play it (a tap lets the browser play sound). */
  const toggle = useCallback(() => {
    if (sounding) {
      stopSiren();
      setSounding(false);
    } else {
      setSounding(startSiren());
    }
  }, [sounding]);

  return { sounding, toggle };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SafetyLevel } from '../lib/safety';
import { notify, sirenAudible, startSiren, stopSiren } from '../lib/siren';
import { canVibrate } from '../lib/sound';

const RANK: Record<SafetyLevel, number> = { safe: 0, watch: 1, early: 2, danger: 3 };

interface Options {
  level: SafetyLevel;
  /** Notification text for the current level (read when the alarm fires). */
  title: string;
  body: string;
}

/**
 * Loud alert when the level RISES to Early warning or Danger: siren (loops
 * until muted), vibration (Android) and a notification (if allowed). Fires
 * once per rise. Sound, notifications and location are independent: the
 * siren plays whenever the browser allows sound (any earlier tap unlocks it).
 *
 * `flash` asks for a full-screen Early warning when the phone can't vibrate
 * (iPhone) or the sound is still locked — its "I understand" tap also starts
 * the siren.
 */
export function useAlarm({ level, title, body }: Options) {
  const [sounding, setSounding] = useState(false);
  const [flash, setFlash] = useState(false);
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
      setFlash(false);
      return;
    }
    if (level === 'danger') setFlash(false); // the red Danger screen takes over
    if (!rose) return;

    const audible = startSiren();
    setSounding(audible);
    // Resuming audio can take a moment: check again.
    const t = setTimeout(() => setSounding(sirenAudible()), 400);
    if (level === 'early' && (!canVibrate() || !audible)) setFlash(true);
    void notify(text.current.title, text.current.body, `nec-${level}`);
    return () => clearTimeout(t);
  }, [level]);

  useEffect(() => () => stopSiren(), []);

  /** "Tap to mute" — or, when silent, play it (the tap lets the browser make sound). */
  const toggle = useCallback(() => {
    if (sounding) {
      stopSiren();
      setSounding(false);
    } else {
      setSounding(startSiren());
      setTimeout(() => setSounding(sirenAudible()), 400);
    }
  }, [sounding]);

  /** Close the full-screen flash; this tap also makes sure the siren is audible. */
  const dismissFlash = useCallback(() => {
    setFlash(false);
    if (!sirenAudible()) {
      setSounding(startSiren());
      setTimeout(() => setSounding(sirenAudible()), 400);
    }
  }, []);

  return { sounding, toggle, flash, dismissFlash };
}

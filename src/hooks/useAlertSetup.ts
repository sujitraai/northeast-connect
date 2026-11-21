import { useCallback, useEffect, useState } from 'react';
import { unlockAudio } from '../lib/sound';

const KEY = 'nec.alerts';

/** null = the "Turn on alerts" screen has not been answered yet. */
export type AlertChoice = 'on' | 'skipped' | null;
export type NotifState = NotificationPermission | 'unsupported';
export type LocationPermission = PermissionState | 'unknown';

function readChoice(): AlertChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'on' || v === 'skipped' ? v : null;
  } catch {
    return null;
  }
}

function saveChoice(v: Exclude<AlertChoice, null>) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* storage unavailable: the screen will show again next visit */
  }
}

const notifNow = (): NotifState => ('Notification' in window ? Notification.permission : 'unsupported');

/**
 * Remembers the "Turn on alerts" answer on this phone and keeps track of the
 * location and notification permissions behind it.
 */
export function useAlertSetup() {
  const [choice, setChoice] = useState<AlertChoice>(readChoice);
  const [notif, setNotif] = useState<NotifState>(notifNow);
  const [location, setLocation] = useState<LocationPermission>('unknown');

  // Watch the location permission where the browser lets us (not all do).
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const update = () => status && setLocation(status.state);
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((s) => {
        status = s;
        update();
        s.addEventListener('change', update);
      })
      .catch(() => {
        /* not supported: stays "unknown" */
      });
    return () => status?.removeEventListener('change', update);
  }, []);

  /** The one tap: unlock sound, ask for location (via `locate`) and notifications. */
  const turnOn = useCallback(async (locate: () => void) => {
    unlockAudio();
    locate();
    saveChoice('on');
    setChoice('on');
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        setNotif(await Notification.requestPermission());
      } catch {
        setNotif(notifNow());
      }
    } else {
      setNotif(notifNow());
    }
  }, []);

  const skip = useCallback(() => {
    saveChoice('skipped');
    setChoice('skipped');
  }, []);

  return { choice, notif, location, turnOn, skip };
}

import { useCallback, useState } from 'react';

export interface Position {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

export type LocateStatus = 'idle' | 'locating' | 'found' | 'error';

export function useGeolocation() {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  // True once the person (or their browser settings) refused location.
  const [denied, setDenied] = useState(false);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('This device cannot share its location.');
      return;
    }
    setStatus('locating');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus('found');
        setDenied(false);
      },
      (err) => {
        setStatus('error');
        setDenied(err.code === err.PERMISSION_DENIED);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location is blocked. Allow location access in your browser settings.'
            : err.code === err.TIMEOUT
              ? 'Finding your location took too long. Try again.'
              : 'Could not find your location. Try again.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  return { status, position, error, denied, locate };
}

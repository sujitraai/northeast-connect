import { useEffect, useState } from 'react';

/** Current time, refreshed every `everyMs` while `on` (e.g. while a simulation runs). */
export function useNow(on: boolean, everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [on, everyMs]);
  return on ? now : Date.now();
}

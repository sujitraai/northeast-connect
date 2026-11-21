import { useCallback, useEffect, useState } from 'react';
import { DEMO_CHANNEL, type DemoLocation } from '../lib/demo';
import { supabase } from '../lib/supabase';

const KEY = 'nec.demo';

function read(): DemoLocation | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v.lat === 'number' && typeof v.lng === 'number' ? { lat: v.lat, lng: v.lng, at: v.at ?? Date.now() } : null;
  } catch {
    return null;
  }
}

/** One id per phone/tab, so each one has its own presence entry. */
const deviceKey = `phone-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Demo location (long-press on the map). Saved on this phone and shared
 * with the admin panel while it is set, so "Flood near demo location" knows
 * where to put the disaster.
 */
export function useDemoLocation() {
  const [demo, setDemo] = useState<DemoLocation | null>(read);

  useEffect(() => {
    if (!supabase || !demo) return;
    const db = supabase;
    const ch = db.channel(DEMO_CHANNEL, { config: { presence: { key: deviceKey } } });
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') void ch.track(demo);
    });
    return () => {
      void ch.untrack();
      void db.removeChannel(ch);
    };
  }, [demo]);

  const set = useCallback((lat: number, lng: number) => {
    const v = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)), at: Date.now() };
    setDemo(v);
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* kept for this visit only */
    }
  }, []);

  const clear = useCallback(() => {
    setDemo(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { demo, set, clear };
}

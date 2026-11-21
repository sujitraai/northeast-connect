import { useEffect, useState } from 'react';
import type { Disaster, RiskZone, Shelter } from '../lib/database.types';
import { supabase } from '../lib/supabase';

/** off = Supabase not set up; live = realtime connected; offline = showing the last load. */
export type LiveStatus = 'off' | 'connecting' | 'live' | 'offline';

export interface LiveMap {
  disasters: Disaster[];
  riskZones: RiskZone[];
  /** Safe places people are sent to in an Early warning / Danger. */
  shelters: Shelter[];
  status: LiveStatus;
  loaded: boolean;
  error: string | null;
  /** When the data was last loaded (ms). */
  updatedAt: number | null;
}

/**
 * Active disasters, risk zones and shelters for the public map. Loads once, then
 * reloads whenever an admin saves (Supabase realtime), when the phone comes
 * back online, and when the app comes back to the front.
 */
export function useLiveMap(): LiveMap {
  const [state, setState] = useState<LiveMap>({
    disasters: [],
    riskZones: [],
    shelters: [],
    status: supabase ? 'connecting' : 'off',
    loaded: false,
    error: null,
    updatedAt: null,
  });

  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      const [d, r, sh] = await Promise.all([
        db.from('disasters').select('*').eq('active', true).order('created_at', { ascending: false }),
        db.from('risk_zones').select('*'),
        db.from('shelters').select('*'),
      ]);
      if (cancelled) return;
      const failed = d.error ?? r.error ?? sh.error;
      setState((s) =>
        failed
          ? { ...s, loaded: true, error: 'Could not load disasters. Check your internet connection.' }
          : {
              ...s,
              disasters: d.data ?? [],
              riskZones: r.data ?? [],
              shelters: sh.data ?? [],
              loaded: true,
              error: null,
              updatedAt: Date.now(),
            },
      );
    };
    // Several changes in a row (e.g. a batch save) cause one reload.
    const reloadSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 150);
    };

    void load();

    const channel = db
      .channel(`public-map-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disasters' }, reloadSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_zones' }, reloadSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, reloadSoon)
      .subscribe((status) => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') {
          setState((s) => ({ ...s, status: 'live' }));
          reloadSoon(); // catch anything saved while we were connecting
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setState((s) => ({ ...s, status: 'offline' }));
        }
      });

    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadSoon();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', reloadSoon);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', reloadSoon);
      void db.removeChannel(channel);
    };
  }, []);

  return state;
}

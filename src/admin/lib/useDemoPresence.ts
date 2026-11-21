import { useEffect, useState } from 'react';
import { DEMO_CHANNEL, latestDemo, type DemoLocation } from '../../lib/demo';
import { supabase } from '../../lib/supabase';

/** The latest demo location set on any phone (null if none is set right now). */
export function useDemoPresence(): DemoLocation | null {
  const [demo, setDemo] = useState<DemoLocation | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    const ch = db.channel(DEMO_CHANNEL);
    ch.on('presence', { event: 'sync' }, () => setDemo(latestDemo(ch.presenceState()))).subscribe();
    return () => {
      void db.removeChannel(ch);
    };
  }, []);
  return demo;
}

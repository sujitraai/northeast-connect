import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export type SessionState =
  | { status: 'no-config' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'not-admin'; email: string }
  | { status: 'error'; message: string }
  | { status: 'admin'; email: string; userId: string };

/** Who is logged in, and whether they are listed in public.admins. */
export function useAdminSession() {
  const [state, setState] = useState<SessionState>(
    supabase ? { status: 'loading' } : { status: 'no-config' },
  );

  const check = useCallback(async (session: Session | null) => {
    if (!supabase) return;
    if (!session) {
      setState({ status: 'signed-out' });
      return;
    }
    const email = session.user.email ?? '';
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      setState({ status: 'error', message: 'Could not check your account. Check your internet and reload.' });
    } else if (data) {
      setState({ status: 'admin', email, userId: session.user.id });
    } else {
      setState({ status: 'not-admin', email });
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // onAuthStateChange fires INITIAL_SESSION straight away, so no separate getSession().
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;
      // Calling Supabase inside this callback can deadlock; defer it.
      setTimeout(() => void check(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [check]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return { state, signOut };
}

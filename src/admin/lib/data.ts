import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Tables = Database['public']['Tables'];
export type EditableTable = 'disasters' | 'contacts' | 'shelters' | 'ngos';
export type RowOf<T extends EditableTable> = Tables[T]['Row'];
export type InsertOf<T extends EditableTable> = Tables[T]['Insert'];

/** Turns a database or network error into one plain sentence. */
export function friendlyError(err: PostgrestError | Error | null | undefined): string {
  if (!err) return 'Something went wrong. Try again.';
  const code = 'code' in err ? err.code : undefined;
  const msg = err.message ?? '';
  if (/fetch|network|load failed/i.test(msg)) {
    return 'No internet connection. Nothing was saved. Try again when you are online.';
  }
  if (code === '42501') return 'Your account is not allowed to do this. Ask another admin to add you.';
  if (code === '23514') return 'Some values are not allowed. Check the phone number, location and lengths.';
  if (code === '23502') return 'A required field is empty.';
  if (code === '22023' || code === 'P0001') return msg;
  if (code === 'PGRST204' || code === '42703' || /spread_kmh|sim_started_at|start_simulation|stop_simulation/.test(msg)) {
    return 'The simulation tools are not installed. Run supabase/05_simulation.sql in the Supabase SQL Editor.';
  }
  if (code === 'PGRST202' || code === '42883') {
    return 'The admin tools are not installed. Run supabase/04_admin_tools.sql in the Supabase SQL Editor.';
  }
  return msg || 'Something went wrong. Try again.';
}

/** Fired after any admin change, so counts and lists elsewhere can refresh. */
const CHANGED = 'nec:data-changed';
export const notifyChange = () => window.dispatchEvent(new Event(CHANGED));
export function onDataChange(fn: () => void) {
  window.addEventListener(CHANGED, fn);
  return () => window.removeEventListener(CHANGED, fn);
}

function client() {
  if (!supabase) throw new Error('Supabase is not connected. Add your keys to .env.local.');
  return supabase;
}

/** Loads all rows of a table, newest first. Call `reload` after a change. */
export function useRows<T extends EditableTable>(table: T) {
  const [rows, setRows] = useState<RowOf<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await client()
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(friendlyError(error));
    else {
      setError(null);
      setRows((data ?? []) as unknown as RowOf<T>[]);
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, loading, error, reload };
}

/** Inserts (id null) or updates a row. Returns an error message, or null on success. */
export async function saveRow<T extends EditableTable>(
  table: T,
  id: string | null,
  values: InsertOf<T>,
): Promise<string | null> {
  try {
    // The generic table name defeats supabase-js's per-table typing, so the
    // values are checked by InsertOf<T> above instead.
    type Res = PromiseLike<{ error: PostgrestError | null; count?: number | null }>;
    const q = client().from(table) as unknown as {
      insert: (v: unknown) => Res;
      update: (v: unknown, o: { count: 'exact' }) => { eq: (c: string, v: string) => Res };
    };
    const { error, count } = id
      ? await q.update(values, { count: 'exact' }).eq('id', id)
      : await q.insert(values);
    if (error) return friendlyError(error);
    // Security rules silently skip rows a non-admin may not change.
    if (id && count === 0) return 'Nothing was saved. The item may have been deleted, or your account is not an admin any more.';
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

export async function deleteRow(table: EditableTable, id: string): Promise<string | null> {
  try {
    const { error, count } = await client().from(table).delete({ count: 'exact' }).eq('id', id);
    if (error) return friendlyError(error);
    if (count === 0) return 'Nothing was deleted. Your account may not be an admin any more.';
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

/** Starts or stops "Simulate" on a disaster (supabase/05_simulation.sql). */
export async function setSimulation(id: string, run: boolean): Promise<string | null> {
  try {
    const { error } = run
      ? await client().rpc('start_simulation', { p_id: id })
      : await client().rpc('stop_simulation', { p_id: id });
    if (error) return friendlyError(error);
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

/** Shows or hides a disaster / NGO on the public map (the "Public" switch). */
export async function setActive(table: 'disasters' | 'ngos', id: string, active: boolean): Promise<string | null> {
  try {
    const { error, count } = await client().from(table).update({ active }, { count: 'exact' }).eq('id', id);
    if (error) return friendlyError(error);
    if (count === 0) return 'Nothing was saved. Your account may not be an admin any more.';
    notifyChange();
    return null;
  } catch (e) {
    return friendlyError(e as Error);
  }
}

export interface Counts {
  disasters: number;
  activeDisasters: number;
  contacts: number;
  shelters: number;
  ngos: number;
  activeNgos: number;
  admins: number;
}

/** Row counts for the sidebar and overview. Null until loaded. */
export function useCounts(): Counts | null {
  const [counts, setCounts] = useState<Counts | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const db = supabase;
    const count = async (table: EditableTable) =>
      (await db.from(table).select('id', { count: 'exact', head: true })).count ?? 0;
    const countActive = async (table: 'disasters' | 'ngos') =>
      (await db.from(table).select('id', { count: 'exact', head: true }).eq('active', true)).count ?? 0;
    try {
      const [disasters, activeDisasters, contacts, shelters, ngos, activeNgos, admins] = await Promise.all([
        count('disasters'),
        countActive('disasters'),
        count('contacts'),
        count('shelters'),
        count('ngos'),
        countActive('ngos'),
        db.rpc('list_admins').then((r) => (r.data ?? []).filter((a) => !a.pending).length),
      ]);
      setCounts({ disasters, activeDisasters, contacts, shelters, ngos, activeNgos, admins });
    } catch {
      /* counts are a nice-to-have; leave the last known values */
    }
  }, []);

  useEffect(() => {
    void load();
    return onDataChange(() => void load());
  }, [load]);

  return counts;
}

/** Empty text → null, so optional columns stay empty in the database. */
export const orNull = (s: string): string | null => (s.trim() === '' ? null : s.trim());

export const PHONE_RE = /^\+?[0-9][0-9 -]{1,19}$/;

/** Same box as the database check (North East India plus a margin). */
export const inNeBox = (lat: number, lng: number) =>
  lat >= 21.5 && lat <= 29.8 && lng >= 87.5 && lng <= 97.8;

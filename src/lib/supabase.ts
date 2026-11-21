import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/** A secret / service_role key bypasses all security rules — never ship one. */
function looksSecret(k: string): boolean {
  if (k.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(atob(k.split('.')[1] ?? ''));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

if (key && looksSecret(key)) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY is a SECRET key. Use the publishable (or legacy "anon") key instead.',
  );
}

/**
 * Supabase client, or null when .env.local has no keys yet.
 * The map still works without it; data features show "not connected".
 */
export const supabase: SupabaseClient<Database> | null =
  url && key ? createClient<Database>(url, key) : null;

export const isSupabaseConfigured = supabase !== null;

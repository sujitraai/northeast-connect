// Checks the Supabase setup using the same key the app uses.
// Usage: npm run db:check
//
// It confirms that:
//   1. .env.local has a URL and a publishable (not secret) key
//   2. every table exists and the public can read it
//   3. the public CANNOT write (security rules are on)

import { createClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env.local');
} catch {
  console.error('✗ No .env.local file. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
let failed = false;
const ok = (msg) => console.log(`✓ ${msg}`);
const bad = (msg) => {
  failed = true;
  console.log(`✗ ${msg}`);
};

if (!url || !key) {
  bad('VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is empty in .env.local');
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.log(`! URL looks unusual (${url}). Expected https://<project-ref>.supabase.co`);
}
let role = null;
try {
  role = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString()).role;
} catch {
  /* not a JWT: new-style key */
}
if (key.startsWith('sb_secret_') || role === 'service_role') {
  bad('That is a SECRET key. Use the publishable (or legacy anon) key. Rotate the secret key if it was shared.');
  process.exit(1);
}
ok('Keys found, and the key is a public one');

const supabase = createClient(url, key, { auth: { persistSession: false } });

// First, can we reach the project at all?
const ping = await supabase.from('disasters').select('id', { head: true });
if (ping.error && /fetch failed|network/i.test(ping.error.message)) {
  bad(`Cannot reach ${url}. Check the Project URL in .env.local and your internet connection.`);
  process.exit(1);
}
if (ping.error && /api key|apikey|jwt/i.test(ping.error.message)) {
  bad(`The key was refused (${ping.error.message}). Re-copy the publishable key.`);
  process.exit(1);
}

for (const table of ['disasters', 'risk_zones', 'contacts', 'shelters', 'ngos']) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) bad(`${table}: ${error.message || error.code}${error.code === '42P01' || error.code === 'PGRST205' ? ' (run supabase/01_schema.sql)' : ''}`);
  else if (!count) bad(`${table}: 0 rows (run supabase/02_seed.sql)`);
  else ok(`${table}: ${count} rows readable`);
}

// The public must not be able to write. Try an insert that would be valid data.
// Only a permission refusal (Postgres code 42501) counts as a pass.
const { data: inserted, error: writeError } = await supabase
  .from('disasters')
  .insert({ type: 'other', severity: 'low', title: 'Security check', lat: 26.1, lng: 91.7, radius_km: 1, is_demo: true, source: 'db:check' })
  .select('id');
if (writeError?.code === '42501') {
  ok('Public cannot write (security rules are on)');
} else if (writeError) {
  bad(`Write test was inconclusive: ${writeError.message || writeError.code}`);
} else {
  bad('PUBLIC CAN WRITE! Security rules are not working. Re-run supabase/01_schema.sql.');
  if (inserted?.[0]) await supabase.from('disasters').delete().eq('id', inserted[0].id);
}

console.log(failed ? '\nSome checks failed.' : '\nAll good. Supabase is ready.');
process.exit(failed ? 1 : 0);

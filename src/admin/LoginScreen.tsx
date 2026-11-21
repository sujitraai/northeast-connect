import { useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Notice, PrimaryButton } from './ui/bits';
import { TextField } from './ui/fields';

/** Frame for the login and "not allowed" screens. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0b0f14] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-base font-semibold text-sky-300">Northeast Connect</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Admin</h1>
        </div>
        {children}
        <a href="/" className="mt-8 inline-block text-base font-semibold text-slate-400 hover:text-white">
          Back to the public map
        </a>
      </div>
    </main>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(
        /invalid login/i.test(error.message)
          ? 'Wrong email or password.'
          : /fetch|network/i.test(error.message)
            ? 'No internet connection. Try again when you are online.'
            : error.message,
      );
    }
    // On success the session hook switches to the panel.
  };

  return (
    <AuthFrame>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Email" type="email" inputMode="email" autoComplete="username" value={email} onChange={setEmail} />
        <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        {error && <Notice tone="error">{error}</Notice>}
        <div className="pt-1 [&>button]:w-full">
          <PrimaryButton type="submit" busy={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </PrimaryButton>
        </div>
        <p className="text-sm text-slate-500">
          Only admins can log in. There is no sign-up. Ask an existing admin to add you.
        </p>
      </form>
    </AuthFrame>
  );
}

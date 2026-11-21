import { useState, type FormEvent, type ReactNode } from 'react';
import { Icon } from '../components/icons';
import Rhino from '../components/Rhino';
import { supabase } from '../lib/supabase';
import { Notice, PrimaryButton } from './ui/bits';
import { TextField } from './ui/fields';

/** Frame for the login and "not allowed" screens. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary-soft to-bg to-50% p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-card bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-inner bg-safe-soft">
              <Rhino className="h-11 w-12" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-muted">Northeast Connect</p>
              <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-ink">Admin login</h1>
            </div>
          </div>
          {children}
        </div>
        <a href="/" className="mt-5 inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-bold text-muted hover:text-ink">
          <Icon name="back" size={16} />
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
        <div className="pt-1 [&>button]:h-12 [&>button]:w-full [&>button]:text-[15px]">
          <PrimaryButton type="submit" busy={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </PrimaryButton>
        </div>
        <p className="text-[12.5px] font-semibold text-muted">
          Only admins can log in. There is no sign-up. Ask an existing admin to add you.
        </p>
      </form>
    </AuthFrame>
  );
}

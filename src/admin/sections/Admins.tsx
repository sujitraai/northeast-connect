import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { AdminEntry } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../lib/data';
import { formatDate } from '../lib/labels';
import { DeleteButton, Notice, PrimaryButton } from '../ui/bits';
import { TextField } from '../ui/fields';
import { PlusIcon } from '../ui/icons';
import { ListPanel, SectionHeader } from '../ui/layout';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Admins() {
  const [list, setList] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('list_admins');
    if (error) setLoadError(friendlyError(error));
    else {
      setLoadError(null);
      setList(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setMessage({ tone: 'error', text: 'Enter a full email address, e.g. name@example.com.' });
      return;
    }
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('add_admin', { p_email: value });
    setBusy(false);
    if (error) {
      setMessage({ tone: 'error', text: friendlyError(error) });
      return;
    }
    setEmail('');
    setMessage(
      data === 'added'
        ? { tone: 'ok', text: `${value} is now an admin. They can log in at /admin.` }
        : data === 'already'
          ? { tone: 'info', text: `${value} is already an admin.` }
          : {
              tone: 'info',
              text: `${value} has no account yet. They will become an admin as soon as their account is created. The project owner creates it in Supabase: Authentication, Users, Add user (tick "Auto Confirm User").`,
            },
    );
    void reload();
  };

  const remove = async (entry: AdminEntry) => {
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('remove_admin', { p_email: entry.email });
    setBusy(false);
    if (error) setMessage({ tone: 'error', text: friendlyError(error) });
    else if (data === 'not_found') setMessage({ tone: 'info', text: `${entry.email} was already removed.` });
    else {
      setMessage({
        tone: 'ok',
        text: entry.pending ? `Invite for ${entry.email} cancelled.` : `${entry.email} is no longer an admin.`,
      });
    }
    void reload();
  };

  const admins = list.filter((a) => !a.pending);

  return (
    <section className="max-w-2xl">
      <SectionHeader title="Manage admins" count={loading ? undefined : admins.length}>
        Admins can add, change and delete everything on the public map. Only add people you trust.
      </SectionHeader>

      <form onSubmit={add} noValidate className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <TextField
          label="Add an admin by email"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="name@example.com"
          value={email}
          onChange={setEmail}
        />
        <div className="mt-3">
          <PrimaryButton type="submit" busy={busy}>
            <PlusIcon />
            Add admin
          </PrimaryButton>
        </div>
      </form>

      {message && (
        <div className="mb-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      <ListPanel loading={loading} error={loadError} empty="No admins found.">
        {list.map((a) => (
          <li key={a.email} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white">
                {a.email}
                {a.is_you && <span className="ml-2 text-sm font-semibold text-sky-300">You</span>}
              </p>
              <p className="text-sm text-slate-400">
                {a.pending
                  ? `Waiting for an account since ${formatDate(a.added_at)}`
                  : `Admin since ${formatDate(a.added_at)}`}
              </p>
            </div>
            {a.is_you ? (
              <span className="text-sm text-slate-500">Another admin must remove you</span>
            ) : (
              <DeleteButton
                busy={busy}
                label={a.pending ? 'Cancel invite' : 'Remove'}
                onConfirm={() => void remove(a)}
              />
            )}
          </li>
        ))}
      </ListPanel>
    </section>
  );
}

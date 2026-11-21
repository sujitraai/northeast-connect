import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { AdminEntry } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { Icon } from '../../components/icons';
import { friendlyError, notifyChange } from '../lib/data';
import { formatDate } from '../lib/labels';
import { DeleteButton, Notice, PrimaryButton } from '../ui/bits';
import { TextField } from '../ui/fields';
import { ListMessage, PageHeader, Panel } from '../ui/layout';

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
    notifyChange();
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
    notifyChange();
  };

  const admins = list.filter((a) => !a.pending);

  return (
    <section className="max-w-3xl">
      <PageHeader
        title="Manage admins"
        help="Admins can add, change and delete everything on the public map. Only add people you trust."
      />

      <Panel title="Add an admin" className="mb-4">
        <form onSubmit={add} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
            />
          </div>
          <PrimaryButton type="submit" busy={busy}>
            <Icon name="plus" size={16} />
            Add admin
          </PrimaryButton>
        </form>
        {message && (
          <div className="mt-3">
            <Notice tone={message.tone}>{message.text}</Notice>
          </div>
        )}
      </Panel>

      <Panel title="Admins" side={!loading && <span className="text-[13px] font-bold text-muted">{admins.length} in total</span>}>
        {loadError ? (
          <Notice tone="error">{loadError}</Notice>
        ) : loading && list.length === 0 ? (
          <ListMessage>Loading…</ListMessage>
        ) : list.length === 0 ? (
          <ListMessage>No admins found.</ListMessage>
        ) : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a.email} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-bg p-3">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-extrabold text-primary uppercase">
                  {a.email[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[14.5px] font-extrabold text-ink">
                    <span className="truncate">{a.email}</span>
                    {a.is_you && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-extrabold text-primary">You</span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    {a.pending
                      ? `Waiting for an account since ${formatDate(a.added_at)}`
                      : `Admin since ${formatDate(a.added_at)}`}
                  </p>
                </div>
                {a.is_you ? (
                  <span className="text-xs font-semibold text-muted">Another admin must remove you</span>
                ) : (
                  <DeleteButton busy={busy} label={a.pending ? 'Cancel invite' : 'Remove'} onConfirm={() => void remove(a)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
}

import { useState } from 'react';

/**
 * Runs a save/delete that returns an error message (or null on success).
 * Keeps the "Saving…" and error state for the form.
 */
export function useSaver() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<string | null>, onSuccess: () => void) => {
    setSaving(true);
    setError(null);
    const err = await task();
    setSaving(false);
    if (err) setError(err);
    else onSuccess();
  };

  return { saving, error, setError, run };
}

export type FormProps<Row> = {
  row: Row | null;
  /** Called after a successful save/delete with a short message for the list. */
  onDone: (message: string) => void;
  onCancel: () => void;
};

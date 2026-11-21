import { useId, type ReactNode } from 'react';

const INPUT =
  'w-full rounded-xl border border-white/15 bg-slate-950/60 px-3.5 py-3 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30';

function Label({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {hint && <span className="ml-2 text-sm text-slate-500">{hint}</span>}
    </label>
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'tel' | 'email' | 'number' | 'password';
  placeholder?: string;
  maxLength?: number;
  list?: string;
  inputMode?: 'numeric' | 'decimal' | 'tel' | 'email';
  autoComplete?: string;
}

export function TextField({ label, value, onChange, hint, ...rest }: TextProps) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} label={label} hint={hint} />
      <input
        id={id}
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  maxLength,
}: Pick<TextProps, 'label' | 'value' | 'onChange' | 'hint' | 'maxLength'>) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} label={label} hint={hint} />
      <textarea
        id={id}
        rows={3}
        className={`${INPUT} resize-y`}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SelectField<V extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string }[];
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} label={label} hint={hint} />
      <div className="relative">
        <select
          id={id}
          className={`${INPUT} appearance-none pr-10`}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-900">
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

/** Row of big buttons for picking one option (easier than a dropdown on a phone). */
export function Segmented<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; icon?: ReactNode; activeClass?: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-slate-200">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-base font-semibold transition ${
                on
                  ? (o.activeClass ?? 'border-sky-400 bg-sky-400/15 text-white')
                  : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/25'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Large on/off switch with a plain-words explanation. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-3.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-base font-semibold text-slate-100">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-slate-400">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition ${
          checked ? 'bg-sky-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
}

import { useId, type ReactNode } from 'react';
import type { Tone } from '../lib/labels';
import { Switch } from './bits';

// 16px on phones (stops iOS zooming into the field), 14px on larger screens.
const INPUT =
  'w-full rounded-xl border-2 border-transparent bg-bg px-3 text-base font-semibold text-ink-2 placeholder:font-medium placeholder:text-faint focus:border-primary focus:bg-white focus:outline-none sm:text-[14px]';

function Label({ htmlFor, label, hint }: { htmlFor: string; label: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-[7px] block text-[12.5px]">
      <span className="font-extrabold text-ink-2">{label}</span>
      {hint && <span className="ml-2 font-semibold text-muted">{hint}</span>}
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
  /** Shown inside the field on the right, e.g. an AUTO badge. */
  badge?: ReactNode;
}

export function TextField({ label, value, onChange, hint, badge, ...rest }: TextProps) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} label={label} hint={hint} />
      <div className="relative">
        <input
          id={id}
          className={`${INPUT} h-11 ${badge ? 'pr-20' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        {badge && <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">{badge}</div>}
      </div>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  maxLength,
  placeholder,
}: Pick<TextProps, 'label' | 'value' | 'onChange' | 'hint' | 'maxLength' | 'placeholder'>) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} label={label} hint={hint} />
      <textarea
        id={id}
        rows={3}
        className={`${INPUT} resize-y py-3`}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
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
          className={`${INPUT} h-11 appearance-none pr-10`}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

const SEG_ON: Record<'primary' | Tone, string> = {
  primary: 'bg-primary-soft text-primary ring-2 ring-primary ring-inset',
  watch: 'bg-watch-soft text-watch ring-2 ring-watch ring-inset',
  danger: 'bg-danger-soft text-danger ring-2 ring-danger ring-inset',
};

/** Row of chips for picking one option (easier than a dropdown on a phone). */
export function Segmented<V extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; icon?: ReactNode; tone?: Tone }[];
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-[7px] text-[12.5px] font-extrabold text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`flex min-h-11 items-center gap-1.5 rounded-xl px-[13px] text-[13.5px] font-bold transition-colors ${
                on ? SEG_ON[o.tone ?? 'primary'] : 'bg-bg text-ink-2 hover:bg-chip'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs font-semibold text-muted">{hint}</p>}
    </fieldset>
  );
}

/** Switch with a label and a short plain-words explanation. */
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
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <div className="pt-0.5">
        <Switch id={id} checked={checked} onChange={onChange} />
      </div>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[13.5px] font-bold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs font-semibold text-muted">{hint}</span>}
      </label>
    </div>
  );
}

/** Slider + number box, styled like the reference "Affected radius". */
export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  unit: string;
}) {
  const id = useId();
  const n = Number(value) || min;
  const fill = `${((Math.min(Math.max(n, min), max) - min) / (max - min)) * 100}%`;
  return (
    <div>
      <Label htmlFor={id} label={label} />
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={Math.min(n, max)}
          onChange={(e) => onChange(e.target.value)}
          className="range min-w-0 flex-1"
          style={{ ['--fill' as string]: fill }}
        />
        <div className="flex w-[108px] shrink-0 items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label}, ${unit}`}
            className={`${INPUT} h-11 text-right font-extrabold`}
          />
          <span className="text-sm font-extrabold text-ink-2">{unit}</span>
        </div>
      </div>
    </div>
  );
}

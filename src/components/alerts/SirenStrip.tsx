import { Icon } from '../icons';

/** White strip under an alert: blinking "Siren on" + "Tap to mute" (the whole strip is the button). */
export default function SirenStrip({
  siren,
  tone,
}: {
  siren: { sounding: boolean; toggle: () => void };
  tone: 'warn' | 'danger';
}) {
  const color = tone === 'warn' ? 'text-warn' : 'text-danger';
  return (
    <button
      type="button"
      onClick={siren.toggle}
      aria-pressed={siren.sounding}
      className={`flex min-h-11 w-full items-center justify-between bg-white px-3.5 py-2 text-[12.5px] font-extrabold ${color}`}
    >
      <span className="flex items-center gap-1.5">
        <i className={`size-2 rounded-full bg-current ${siren.sounding ? 'blink' : 'opacity-40'}`} />
        {siren.sounding ? 'Siren on' : 'Siren off'}
      </span>
      <span className="flex items-center gap-1.5 text-muted">
        <Icon name={siren.sounding ? 'volumex' : 'volume'} size={14} />
        {siren.sounding ? 'Tap to mute' : 'Tap to play siren'}
      </span>
    </button>
  );
}

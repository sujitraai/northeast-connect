import { Icon, type IconName } from './icons';
import Rhino from './Rhino';

const ROWS: { icon: IconName; tile: string; title: string; sub: string }[] = [
  { icon: 'volume', tile: 'bg-danger-soft text-danger', title: 'Loud siren', sub: 'Plays while the app is open' },
  { icon: 'vibrate', tile: 'bg-watch-soft text-watch', title: 'Vibration', sub: 'So you feel it in your pocket' },
  { icon: 'pin', tile: 'bg-primary-soft text-primary', title: 'Your location', sub: "Only to check what's near you" },
];

interface Props {
  onTurnOn: () => void;
  onSkip: () => void;
  /** Shown when the browser has already blocked a permission. */
  blockedNote?: string | null;
}

/** First-open screen (reference screen 0). One tap unlocks sound and asks for permissions. */
export default function TurnOnAlerts({ onTurnOn, onSkip, blockedNote }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="turn-on-title"
      className="slide-up fixed inset-0 z-[2000] overflow-y-auto bg-gradient-to-b from-primary-soft to-bg to-[46%]"
    >
      <div className="mx-auto flex min-h-full max-w-md flex-col px-[22px] pt-[max(56px,env(safe-area-inset-top))] pb-[max(26px,env(safe-area-inset-bottom))] text-center">
        <div className="relative mx-auto mt-1.5 mb-[30px] grid size-[150px] place-items-center rounded-full bg-white shadow-soft">
          <span aria-hidden className="absolute -inset-3.5 rounded-full border-2 border-primary/20" />
          <span aria-hidden className="absolute -inset-[30px] rounded-full border-2 border-primary/10" />
          <Rhino className="h-[104px] w-[112px]" />
        </div>

        <h1 id="turn-on-title" className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          Turn on alerts
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-[15px] leading-normal text-ink-2">
          I'll sound a loud siren if a flood, landslide or earthquake is coming towards you — before it reaches you.
        </p>

        <ul className="mt-3">
          {ROWS.map((r) => (
            <li key={r.title} className="mt-[9px] flex items-center gap-3 rounded-[18px] bg-white p-3 text-left">
              <span className={`grid size-10 shrink-0 place-items-center rounded-[13px] ${r.tile}`}>
                <Icon name={r.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14.5px] font-extrabold text-ink">{r.title}</b>
                <span className="text-[12.5px] font-semibold text-muted">{r.sub}</span>
              </span>
              <span className="text-safe">
                <Icon name="check" size={20} />
              </span>
            </li>
          ))}
        </ul>

        <div className="min-h-6 flex-1" />

        {blockedNote && (
          <p role="alert" className="mb-3 rounded-btn bg-watch-soft px-4 py-3 text-left text-[13px] leading-snug font-semibold text-[#92400E]">
            {blockedNote}
          </p>
        )}

        <button
          type="button"
          onClick={onTurnOn}
          className="flex h-[56px] w-full items-center justify-center gap-2.5 rounded-[18px] bg-navy text-[16px] font-extrabold text-white active:scale-[0.99]"
        >
          <Icon name="bell" size={18} />
          Turn on alerts
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-muted">
          <Icon name="volume" size={14} />
          Keep your phone off silent mode
        </p>
        <button type="button" onClick={onSkip} className="mx-auto mt-2 min-h-11 px-4 text-[13.5px] font-bold text-muted underline-offset-2 hover:underline">
          Not now
        </button>
      </div>
    </div>
  );
}

import { Icon, type IconName } from './icons';

export type TabId = 'map' | 'alerts' | 'help' | 'ngos';

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'alerts', label: 'Alerts', icon: 'bell' },
  { id: 'help', label: 'Help', icon: 'phone' },
  { id: 'ngos', label: 'NGOs', icon: 'users' },
];

interface Props {
  current: TabId;
  onChange: (tab: TabId) => void;
  /** Red dot on Alerts when there is something new. */
  alertBadge?: boolean;
}

/** Floating pill nav. Active tab = navy pill with icon + label. */
export default function BottomNav({ current, onChange, alertBadge }: Props) {
  return (
    <nav
      aria-label="Main"
      className="pointer-events-auto flex h-[68px] items-center justify-around rounded-full bg-white/95 px-2 shadow-nav backdrop-blur-md"
    >
      {TABS.map((t) => {
        const on = t.id === current;
        return (
          <button
            key={t.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center rounded-full font-bold transition-colors ${
              on
                ? 'flex-row gap-[7px] bg-navy px-4 py-3 text-[13.5px] text-white'
                : 'min-w-14 flex-col gap-[3px] px-3 py-2 text-[11px] text-faint hover:text-ink-2'
            }`}
          >
            <Icon name={t.icon} size={on ? 18 : 20} />
            {t.label}
            {t.id === 'alerts' && alertBadge && !on && (
              <i className="absolute top-1 right-2.5 size-2.5 rounded-full border-2 border-white bg-danger" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

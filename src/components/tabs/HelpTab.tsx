import { Icon, type IconName } from '../icons';
import { EmptyState, GroupTitle, SheetHead } from '../sheet';

/** India's real national helplines: always first, for everyone, no "Demo" tag. */
const NATIONAL: { number: string; title: string; sub: string; icon: IconName; tile: string }[] = [
  { number: '112', title: 'All emergencies', sub: 'Police, fire, ambulance', icon: 'alert', tile: 'bg-danger-soft text-danger' },
  { number: '108', title: 'Ambulance', sub: 'Free, 24 × 7', icon: 'cross', tile: 'bg-primary-soft text-primary' },
  { number: '101', title: 'Fire', sub: 'Fire and rescue', icon: 'flame', tile: 'bg-warn-soft text-warn' },
  { number: '100', title: 'Police', sub: 'Police control room', icon: 'shield', tile: 'bg-chip text-ink-2' },
];

/** One-tap call row: the whole row is the call link. */
export function CallRow({ number, title, sub, icon, tile }: (typeof NATIONAL)[number]) {
  return (
    <a
      href={`tel:${number}`}
      aria-label={`Call ${number}, ${title}`}
      className="mb-2 flex items-center gap-3 rounded-[18px] bg-bg p-2.5 active:scale-[0.99]"
    >
      <span className={`grid size-[42px] shrink-0 place-items-center rounded-[14px] ${tile}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] font-extrabold text-ink">{title}</b>
        <span className="text-[12.5px] font-semibold text-muted">{sub}</span>
      </span>
      <span className="mr-1 text-base font-extrabold text-ink">{number}</span>
      <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-safe text-white">
        <Icon name="phone" size={18} />
      </span>
    </a>
  );
}

export default function HelpTab({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Contacts" sub="Tap a row to call." onClose={onClose} />
      <GroupTitle>National emergency numbers</GroupTitle>
      {NATIONAL.map((n) => (
        <CallRow key={n.number} {...n} />
      ))}
      <EmptyState icon="tent" title="Local help is not listed yet">
        District numbers, shelters and hospitals near you will be listed here.
      </EmptyState>
    </>
  );
}

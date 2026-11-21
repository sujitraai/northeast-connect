import { Icon } from '../icons';
import { EmptyState, GroupTitle, SheetHead } from '../sheet';

/**
 * 112 is India's real national emergency number, so it is shown now (no
 * "Demo" tag) and help is always two taps away. Local numbers, shelters and
 * hospitals come later.
 */
export default function HelpTab({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Help near you" sub="Tap the green button to call." onClose={onClose} />
      <GroupTitle>Emergency numbers</GroupTitle>
      <a
        href="tel:112"
        className="flex items-center gap-3 rounded-[18px] bg-bg p-2.5 active:scale-[0.99]"
        aria-label="Call 112, all emergencies: police, fire, ambulance"
      >
        <span className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-danger-soft text-danger">
          <Icon name="alert" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] font-extrabold text-ink">All emergencies</b>
          <span className="text-[12.5px] font-semibold text-muted">Police, fire, ambulance</span>
        </span>
        <span className="mr-1 text-base font-extrabold text-ink">112</span>
        <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-safe text-white">
          <Icon name="phone" size={18} />
        </span>
      </a>
      <EmptyState icon="tent" title="Local help is not listed yet">
        District numbers, shelters and hospitals near you will be listed here.
      </EmptyState>
    </>
  );
}

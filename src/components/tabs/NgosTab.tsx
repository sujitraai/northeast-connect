import { Icon } from '../icons';
import { SheetHead } from '../sheet';

export default function NgosTab({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Help groups on site" sub="Volunteers and NGOs working at a disaster." onClose={onClose} />
      <div className="mt-4 flex flex-col items-center rounded-inner bg-bg px-6 py-8 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-white text-ink-2 shadow-soft">
          <Icon name="users" size={26} />
        </div>
        <p className="mt-4 text-base font-extrabold text-ink">No help groups near you yet</p>
        <a
          href="tel:112"
          className="mt-4 inline-flex h-12 items-center gap-2 rounded-btn bg-danger px-5 text-[15px] font-extrabold text-white active:scale-[0.98]"
        >
          <Icon name="phone" size={18} />
          Call 112
        </a>
      </div>
    </>
  );
}

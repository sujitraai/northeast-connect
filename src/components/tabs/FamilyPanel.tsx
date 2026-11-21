import { EmptyState, SheetHead } from '../sheet';

/** "Alert family" — the WhatsApp / SMS messages come in a later step. */
export default function FamilyPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Alert your family" sub="Tell them you're safe, or that you need help." onClose={onClose} />
      <EmptyState icon="users" title="Not ready yet">
        Soon you can send your location to up to 3 family members on WhatsApp or SMS. For now, call them directly.
      </EmptyState>
      <a
        href="tel:112"
        className="mt-3 flex h-12 items-center justify-center rounded-btn bg-danger text-[15px] font-extrabold text-white"
      >
        Need help now? Call 112
      </a>
    </>
  );
}

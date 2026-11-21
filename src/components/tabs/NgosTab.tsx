import { EmptyState, SheetHead } from '../sheet';

export default function NgosTab({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Help groups on site" sub="NGOs and volunteers working at a disaster." onClose={onClose} />
      <EmptyState icon="users" title="No help groups listed yet">
        Groups helping at a disaster will be listed here, with one tap to call them.
      </EmptyState>
    </>
  );
}

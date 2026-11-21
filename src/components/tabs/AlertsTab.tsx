import { EmptyState, SheetHead } from '../sheet';

export default function AlertsTab({ onClose }: { onClose: () => void }) {
  return (
    <>
      <SheetHead title="Alerts" sub="Floods, landslides and earthquakes near you." onClose={onClose} />
      <EmptyState icon="bell" title="Live alerts are not switched on yet">
        Until they are, follow warnings from your district administration.
      </EmptyState>
    </>
  );
}

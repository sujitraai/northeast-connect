import { GUIDANCE } from '../../lib/guidance';
import type { Nearest } from '../../lib/safety';
import { formatEta, isSimulating } from '../../lib/simulation';
import { Icon } from '../icons';
import Rhino from '../Rhino';

/**
 * Full-screen Early warning, for phones that can't vibrate (iPhone) or when
 * sound is still locked. One big tap target: closing it also starts the siren.
 */
export default function EarlyFlash({ lead, onDismiss }: { lead: Nearest; onDismiss: () => void }) {
  const g = GUIDANCE[lead.disaster.type];
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="flash-title"
      className="early-flash fixed inset-0 z-[1950] flex flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[max(24px,env(safe-area-inset-bottom))] text-center text-white"
    >
      <div className="grid size-[120px] place-items-center rounded-full bg-white/20">
        <Rhino mood="scared" className="h-[92px] w-[100px]" />
      </div>
      <p className="mt-6 text-[13px] font-extrabold tracking-[0.16em]">EARLY WARNING · {g.name.toUpperCase()}</p>
      <h1 id="flash-title" className="mt-2 text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
        {g.name} may reach you in {lead.etaHours !== null ? formatEta(lead.etaHours) : 'soon'}
      </h1>
      <p className="mt-2 text-[15px] font-bold opacity-90">
        {lead.disaster.title} · {isSimulating(lead.disaster) ? 'Simulation' : 'Estimate'}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        autoFocus
        className="mt-10 flex h-[60px] w-full max-w-sm items-center justify-center gap-2.5 rounded-[18px] bg-white text-[17px] font-extrabold text-warn shadow-[0_10px_30px_rgba(0,0,0,.18)] active:scale-[0.99]"
      >
        <Icon name="check" size={20} />
        I understand
      </button>
      <p className="mt-3 text-[13px] font-bold opacity-90">Then go to the safe place shown on the map.</p>
    </div>
  );
}

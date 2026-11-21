import { useEffect, useState, type ComponentType } from 'react';
import { Icon, type IconName } from '../components/icons';
import Rhino from '../components/Rhino';
import { useGeoData } from '../hooks/useGeoData';
import { GeoContext } from './geo';
import { useCounts, type Counts } from './lib/data';
import Admins from './sections/Admins';
import Contacts from './sections/Contacts';
import Disasters from './sections/Disasters';
import Ngos from './sections/Ngos';
import Overview from './sections/Overview';
import Shelters from './sections/Shelters';
import type { SectionProps } from './ui/CrudSection';
import { Notice } from './ui/bits';

type SectionId = 'overview' | 'disasters' | 'contacts' | 'shelters' | 'ngos' | 'admins';

const SECTIONS: { id: SectionId; label: string; icon: IconName; count?: keyof Counts }[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'disasters', label: 'Disasters', icon: 'alert', count: 'disasters' },
  { id: 'contacts', label: 'Contacts', icon: 'phone', count: 'contacts' },
  { id: 'shelters', label: 'Shelters', icon: 'tent', count: 'shelters' },
  { id: 'ngos', label: 'NGOs', icon: 'users', count: 'ngos' },
  { id: 'admins', label: 'Admins', icon: 'shield', count: 'admins' },
];

const LIST_VIEWS: Record<Exclude<SectionId, 'overview' | 'admins'>, ComponentType<SectionProps>> = {
  disasters: Disasters,
  contacts: Contacts,
  shelters: Shelters,
  ngos: Ngos,
};

/** Current section from the URL hash (#contacts, or #disasters/new to open the form). */
function useHashRoute() {
  const read = () => {
    const [id, sub] = window.location.hash.slice(1).split('/');
    const known = SECTIONS.some((s) => s.id === id);
    return { id: (known ? id : 'overview') as SectionId, startNew: known && sub === 'new' };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid shrink-0 place-items-center rounded-[13px] bg-safe-soft ${compact ? 'size-9' : 'size-10'}`}>
        <Rhino className={compact ? 'h-7 w-[30px]' : 'h-8 w-[34px]'} />
      </span>
      <span className="leading-tight">
        <b className="block text-[15px] font-extrabold text-ink">Northeast Connect</b>
        <span className="text-[11.5px] font-bold tracking-[0.04em] text-muted">ADMIN</span>
      </span>
    </div>
  );
}

export default function AdminShell({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const geo = useGeoData();
  const counts = useCounts();
  const { id: current, startNew } = useHashRoute();

  const view =
    current === 'overview' ? (
      <Overview counts={counts} />
    ) : current === 'admins' ? (
      <Admins />
    ) : (
      (() => {
        const View = LIST_VIEWS[current];
        // key: switching section (or opening "add") resets any open form.
        return <View key={`${current}${startNew ? '/new' : ''}`} startNew={startNew} />;
      })()
    );

  return (
    <GeoContext.Provider value={geo}>
      <div className="min-h-dvh bg-bg text-ink lg:grid lg:grid-cols-[236px_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-line bg-white px-4 py-[22px] lg:flex">
          <div className="mb-[22px] px-1.5">
            <Brand />
          </div>
          <nav aria-label="Admin sections" className="flex flex-col gap-1">
            {SECTIONS.map((s) => {
              const on = s.id === current;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  aria-current={on ? 'page' : undefined}
                  className={`flex items-center gap-[11px] rounded-[14px] px-3 py-[11px] text-sm font-bold transition-colors ${
                    on ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-bg'
                  }`}
                >
                  <Icon name={s.icon} size={18} />
                  {s.label}
                  {s.count && counts && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[11.5px] ${on ? 'bg-white text-primary' : 'bg-bg text-muted'}`}
                    >
                      {counts[s.count]}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
          <div className="mt-auto rounded-btn bg-bg p-3 text-xs font-semibold text-muted">
            <span>Signed in as</span>
            <b className="block truncate text-[13px] text-ink" title={email}>
              {email}
            </b>
            <p className="mt-1.5">Disaster changes reach the public map within seconds.</p>
            <div className="mt-2.5 flex flex-col gap-0.5">
              <a href="/" className="flex min-h-9 items-center gap-2 font-bold text-ink-2 hover:text-ink">
                <Icon name="external" size={15} />
                Open public map
              </a>
              <button type="button" onClick={onSignOut} className="flex min-h-9 items-center gap-2 font-bold text-ink-2 hover:text-ink">
                <Icon name="logout" size={15} />
                Log out
              </button>
            </div>
          </div>
        </aside>

        {/* Phone top bar */}
        <header className="sticky top-0 z-[1100] flex items-center justify-between gap-3 bg-bg/90 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md lg:hidden">
          <Brand compact />
          <div className="flex gap-1.5">
            <a href="/" aria-label="Open public map" className="grid size-11 place-items-center rounded-xl bg-white text-ink-2 shadow-soft">
              <Icon name="external" size={18} />
            </a>
            <button type="button" onClick={onSignOut} aria-label="Log out" className="grid size-11 place-items-center rounded-xl bg-white text-ink-2 shadow-soft">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>

        <main className="min-w-0 px-4 pt-3 pb-32 lg:px-7 lg:pt-[26px] lg:pb-10">
          {geo.error && (
            <div className="mb-4">
              <Notice tone="error">Map boundaries did not load. Reload the page to pick locations.</Notice>
            </div>
          )}
          {view}
        </main>

        {/* Phone bottom pill nav, like the public app */}
        <nav
          aria-label="Admin sections"
          className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[1100] flex h-[64px] items-center justify-between rounded-full bg-white/95 px-1.5 shadow-nav backdrop-blur-md lg:hidden"
        >
          {SECTIONS.map((s) => {
            const on = s.id === current;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={on ? 'page' : undefined}
                className={`flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-[10px] font-bold ${
                  on ? 'bg-navy text-white' : 'text-faint'
                }`}
              >
                <Icon name={s.icon} size={18} />
                {s.label}
              </a>
            );
          })}
        </nav>
      </div>
    </GeoContext.Provider>
  );
}

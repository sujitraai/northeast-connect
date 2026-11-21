import { useEffect, useState, type ComponentType } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import { GeoContext } from './geo';
import Admins from './sections/Admins';
import Contacts from './sections/Contacts';
import Disasters from './sections/Disasters';
import Ngos from './sections/Ngos';
import Shelters from './sections/Shelters';
import { AdminsIcon, AlertIcon, ContactIcon, LogoutIcon, MapIcon, NgoIcon, ShelterIcon } from './ui/icons';

const SECTIONS: { id: string; label: string; Icon: ComponentType; View: ComponentType }[] = [
  { id: 'disasters', label: 'Disasters', Icon: AlertIcon, View: Disasters },
  { id: 'contacts', label: 'Contacts', Icon: ContactIcon, View: Contacts },
  { id: 'shelters', label: 'Shelters', Icon: ShelterIcon, View: Shelters },
  { id: 'ngos', label: 'NGOs', Icon: NgoIcon, View: Ngos },
  { id: 'admins', label: 'Admins', Icon: AdminsIcon, View: Admins },
];

/** Current section from the URL hash (#contacts), so reload keeps your place. */
function useHashSection() {
  const read = () => {
    const h = window.location.hash.slice(1);
    return SECTIONS.some((s) => s.id === h) ? h : 'disasters';
  };
  const [id, setId] = useState(read);
  useEffect(() => {
    const onHash = () => setId(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return id;
}

export default function AdminShell({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const geo = useGeoData();
  const current = useHashSection();
  const section = SECTIONS.find((s) => s.id === current)!;

  return (
    <GeoContext.Provider value={geo}>
      <div className="min-h-dvh bg-[#0b0f14] text-slate-100 lg:flex">
        {/* Sidebar (desktop) / top bar + tabs (phone) */}
        <aside className="sticky top-0 z-[1100] border-b border-white/10 bg-[#0b0f14]/95 backdrop-blur lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 lg:block lg:px-5 lg:pt-6 lg:pb-6">
            <div>
              <p className="text-sm font-semibold text-sky-300">Northeast Connect</p>
              <p className="text-xl font-extrabold leading-tight text-white">Admin</p>
            </div>
            <div className="flex items-center gap-1 lg:hidden">
              <a href="/" aria-label="Open public map" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10">
                <MapIcon />
              </a>
              <button type="button" onClick={onSignOut} aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10">
                <LogoutIcon />
              </button>
            </div>
          </div>

          <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3">
            {SECTIONS.map(({ id, label, Icon }) => {
              const on = id === current;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-base font-semibold transition lg:min-h-12 ${
                    on ? 'bg-sky-400/15 text-white ring-1 ring-sky-400/50' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <Icon />
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="hidden px-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block lg:pb-6">
            <a href="/" className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-300 hover:text-white">
              <MapIcon />
              Open public map
            </a>
            <p className="truncate text-sm text-slate-500" title={email}>
              {email}
            </p>
            <button type="button" onClick={onSignOut} className="mt-2 flex min-h-11 items-center gap-2 text-base font-semibold text-slate-300 hover:text-white">
              <LogoutIcon />
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-16 lg:px-10 lg:pt-10">
          {geo.error && (
            <p className="mb-4 text-sm text-amber-300">Map boundaries did not load. Reload the page to pick locations.</p>
          )}
          {/* key: switching section resets any open form. */}
          <section.View key={section.id} />
        </main>
      </div>
    </GeoContext.Provider>
  );
}

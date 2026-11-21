import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import { installSoundUnlock } from './lib/sound';

// The admin panel is a separate download, so the public map stays light.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const isAdminPath = /^\/admin(\/|$)/.test(window.location.pathname);

// Any tap in the public app unlocks the siren (separate from location and notifications).
if (!isAdminPath) installSoundUnlock();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath ? (
      <Suspense fallback={<div className="h-dvh bg-bg" />}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';

// The admin panel is a separate download, so the public map stays light.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const isAdminPath = /^\/admin(\/|$)/.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath ? (
      <Suspense fallback={<div className="h-dvh bg-[#0b0f14]" />}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

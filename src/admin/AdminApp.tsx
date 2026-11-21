import AdminShell from './AdminShell';
import LoginScreen, { AuthFrame } from './LoginScreen';
import { useAdminSession } from './lib/useAdminSession';
import { Notice, PrimaryButton } from './ui/bits';

/** /admin — login gate, then the admin panel. */
export default function AdminApp() {
  const { state, signOut } = useAdminSession();

  switch (state.status) {
    case 'no-config':
      return (
        <AuthFrame>
          <Notice tone="error">
            Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local and
            restart the app.
          </Notice>
        </AuthFrame>
      );
    case 'loading':
      return (
        <AuthFrame>
          <p className="text-sm font-semibold text-muted">Checking your account…</p>
        </AuthFrame>
      );
    case 'signed-out':
      return <LoginScreen />;
    case 'error':
      return (
        <AuthFrame>
          <Notice tone="error">{state.message}</Notice>
        </AuthFrame>
      );
    case 'not-admin':
      return (
        <AuthFrame>
          <div className="space-y-4">
            <Notice tone="error">
              {state.email} is not an admin. Ask an existing admin to add this email on the Admins page.
            </Notice>
            <PrimaryButton onClick={() => void signOut()}>Log in with another account</PrimaryButton>
          </div>
        </AuthFrame>
      );
    case 'admin':
      return <AdminShell email={state.email} onSignOut={() => void signOut()} />;
  }
}

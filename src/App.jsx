import { useState } from 'react';
import AppShell from './app/AppShell.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import { DemoStateProvider } from './context/DemoStateContext.jsx';
import { useApp } from './context/AppContext.jsx';

// Navigation and module UI state for ONE persona. It is keyed by persona id below, so
// switching persona remounts it: the new persona lands on its own dashboard and no
// filter, selection or draft from the previous persona survives.
function RoleWorkspace() {
  const { access } = useApp();
  const [activeRoute, setActiveRoute] = useState(access.landing);
  return <AppShell activeRoute={activeRoute} onNavigate={setActiveRoute} />;
}

// Everything that needs a signed-in persona lives below this component. Because it
// is unmounted on logout, route, module and shared demo state are all reset for the next session.
function AuthenticatedApp() {
  const { user } = useApp();
  return (
    <DemoStateProvider>
      <RoleWorkspace key={user.id} />
    </DemoStateProvider>
  );
}

export default function App() {
  const { isAuthenticated } = useApp();

  // Route guard (demo-only, see AppContext): protected routes never render while logged out.
  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
}

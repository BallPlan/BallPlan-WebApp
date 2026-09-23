import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AgentAuthProvider, useAgentAuth } from './context/AgentAuthContext';
import { setCurrentAgentId } from './lib/agentData';

import AgentLayout from './components/AgentLayout';
import AgentLogin from './pages/AgentLogin';
import AgentDashboard from './pages/AgentDashboard';
import AgentVenues from './pages/AgentVenues';
import AgentVenueForm from './pages/AgentVenueForm';
import AgentReviews from './pages/AgentReviews';
import AgentSettings from './pages/AgentSettings';
import AgentLogout from './pages/AgentLogout';

// Keeps the agentData module's "whose venues am I scoped to" pointer in
// sync with whoever is actually signed in — logging out (or switching
// accounts) must clear the previous agent's cached venues.
function SyncAgentScope() {
  const { user } = useAgentAuth();
  useEffect(() => {
    setCurrentAgentId(user?.id ?? null);
  }, [user?.id]);
  return null;
}

function RequireAuth({ children }) {
  const { isAgent, loading } = useAgentAuth();
  if (loading) return null;
  if (!isAgent) return <Navigate to="/login" replace />;
  return children;
}

export default function AgentApp() {
  return (
    <ToastProvider>
      <AgentAuthProvider>
        <HashRouter>
          <SyncAgentScope />
          <Routes>
            <Route path="/login" element={<AgentLogin />} />
            <Route
              element={
                <RequireAuth>
                  <AgentLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<AgentDashboard />} />
              <Route path="/venues" element={<AgentVenues />} />
              <Route path="/venues/new" element={<AgentVenueForm />} />
              <Route path="/venues/:id/edit" element={<AgentVenueForm />} />
              <Route path="/reviews" element={<AgentReviews />} />
              <Route path="/settings" element={<AgentSettings />} />
              <Route path="/logout" element={<AgentLogout />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AgentAuthProvider>
    </ToastProvider>
  );
}

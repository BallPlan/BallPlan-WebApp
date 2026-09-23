import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { useAdminThemeStore } from '../shared/store';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Venues from './pages/Venues';
import VenueForm from './pages/VenueForm';
import AdminVenueDetails from './pages/AdminVenueDetails';
import Users from './pages/Users';
import Reviews from './pages/Reviews';
import Waitlist from './pages/Waitlist';
import NotificationsPage from './pages/NotificationsPage';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Logout from './pages/Logout';

function ThemeSync() {
  const theme = useAdminThemeStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}

function RequireAuth({ children }) {
  const { isStaff, loading } = useAdminAuth();
  if (loading) return null;
  if (!isStaff) return <Navigate to="/login" replace />;
  return children;
}

// LoginPage is swappable so the /support bundle (SupportApp.jsx) can reuse
// every route, page and piece of data logic here untouched — same auth
// backend, same nav, same permissions — while showing its own branded
// login screen instead of "BallPlan Admin". That's also what makes /support
// a genuinely separate build (its own HTML entry and JS bundle), not just
// the admin page re-served under a different URL.
export default function AdminApp({ LoginPage = AdminLogin }) {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <HashRouter>
          <ThemeSync />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/new" element={<VenueForm />} />
              <Route path="/venues/:id" element={<AdminVenueDetails />} />
              <Route path="/venues/:id/edit" element={<VenueForm />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AdminAuthProvider>
    </ToastProvider>
  );
}

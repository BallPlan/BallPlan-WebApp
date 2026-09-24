import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { activateSupportSession } from '../admin/lib/supabaseClient.js';
import AdminApp from '../admin/AdminApp.jsx';
import SupportLogin from './pages/SupportLogin.jsx';

// /support is its own HTML entry and JS bundle (see vite.config.js +
// vercel.json), not the admin page re-served under a different URL — it
// reuses AdminApp's routes/pages/data logic wholesale (see AdminApp.jsx)
// since the two portals behave identically for signed-in staff, but with
// its own branded login screen, its own isolated Supabase Auth session
// (repointed here, before anything renders, so no code in admin/lib/*
// ever touches the /admin session), and allowedRoles restricted to
// 'support' only — an owner account cannot sign in here, matching /admin
// restricting itself to 'owner' only.
activateSupportSession();

createRoot(document.getElementById('support-root')).render(
  <StrictMode>
    <AdminApp LoginPage={SupportLogin} allowedRoles={['support']} />
  </StrictMode>,
);

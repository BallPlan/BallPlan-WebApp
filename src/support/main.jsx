import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AdminApp from '../admin/AdminApp.jsx';
import SupportLogin from './pages/SupportLogin.jsx';

// /support is its own HTML entry and JS bundle (see vite.config.js +
// vercel.json), not the admin page re-served under a different URL — it
// just reuses AdminApp's routes/pages/auth wholesale (see AdminApp.jsx)
// since the two portals are meant to behave identically for signed-in
// staff, and only swaps in a Support-branded login screen.
createRoot(document.getElementById('support-root')).render(
  <StrictMode>
    <AdminApp LoginPage={SupportLogin} />
  </StrictMode>,
);

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../lib/analytics';

// Renders nothing — logs one page view per route change for the admin
// dashboard's visitor chart.
export default function PageViewTracker() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const userIdRef = useRef(null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    trackPageView(pathname, userIdRef.current);
  }, [pathname]);

  return null;
}

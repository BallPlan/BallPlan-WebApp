import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationsContext = createContext(null);

// The signed-in customer's notifications: loaded once, kept live over
// Supabase Realtime (so a push from the admin dashboard or an automatic
// one — new venue, price drop, plan ready — appears immediately with a
// toast), and refreshed whenever the tab comes back into view as a safety
// net in case the socket dropped while it was in the background.
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    setItems(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new;
          setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
          const body = n.body && n.body.length > 90 ? `${n.body.slice(0, 90)}…` : n.body;
          notify(body ? `${n.title} — ${body}` : n.title, 'info', 6000);
        },
      )
      .subscribe();

    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, load, notify]);

  const markRead = useCallback((id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    supabase.from('notifications').update({ read: true }).in('id', unreadIds).then(() => {});
  }, [items]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({ notifications: items, loading, unreadCount, markRead, markAllRead }),
    [items, loading, unreadCount, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

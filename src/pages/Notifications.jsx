import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import BackButton from '../components/BackButton';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setNotifications(data || []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    supabase.from('notifications').update({ read: true }).eq('id', id).then();
  };

  const markAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (unreadIds.length) supabase.from('notifications').update({ read: true }).in('id', unreadIds).then();
  };

  const recent = useMemo(() => notifications.filter((n) => n.group_name !== 'older'), [notifications]);
  const older = useMemo(() => notifications.filter((n) => n.group_name === 'older'), [notifications]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const Section = ({ title, list }) =>
    list.length === 0 ? null : (
      <div className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink/40 dark:text-white/40">{title}</h2>
        <div className="space-y-2">
          {list.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => markRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-card transition hover:shadow-card-hover ${
                n.read ? 'bg-white/70 dark:bg-white/5' : 'bg-white dark:bg-[#1c1c1e]'
              }`}
            >
              <span
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  n.read ? 'bg-ink/5 text-ink/30 dark:bg-white/10 dark:text-white/30' : 'bg-brand/10 text-brand'
                }`}
              >
                <Bell size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm ${
                      n.read ? 'font-medium text-ink/60 dark:text-white/60' : 'font-bold text-ink dark:text-white'
                    }`}
                  >
                    {n.title}
                  </p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </div>
                <p className="mt-0.5 text-sm text-ink/50 dark:text-white/50">{n.body}</p>
                <p className="mt-1 text-xs text-ink/35 dark:text-white/35">{timeAgo(n.created_at)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-display text-2xl font-extrabold text-ink dark:text-white">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white align-middle">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {!loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink/15 bg-white/60 py-16 text-center dark:border-white/15 dark:bg-white/5">
          <BellOff size={40} className="text-ink/20 dark:text-white/20" />
          <p className="mt-3 text-ink/50 dark:text-white/50">
            {user ? "You're all caught up." : 'Sign in to see your notifications.'}
          </p>
        </div>
      ) : (
        <>
          <Section title="Recent" list={recent} />
          <Section title="Older" list={older} />
        </>
      )}
    </div>
  );
}

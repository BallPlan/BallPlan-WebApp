import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, BellOff, CheckCheck, Sparkles, Store, TrendingDown, ClipboardList, Star, Flag } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const KIND_ICON = {
  welcome: Sparkles,
  new_venue: Store,
  price_drop: TrendingDown,
  plan_downloaded: ClipboardList,
  plan_saved: ClipboardList,
  review: Star,
  report_received: Flag,
  report_resolved: Flag,
  report_dismissed: Flag,
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

function NotificationList({ title, list, onOpen }) {
  if (list.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink/40 dark:text-white/40">{title}</h2>
      <div className="space-y-2">
        {list.map((n, i) => {
          const Icon = KIND_ICON[n.kind] || Bell;
          return (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => onOpen(n)}
              className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-card transition hover:shadow-card-hover ${
                n.read ? 'bg-white/70 dark:bg-white/5' : 'bg-white dark:bg-[#1c1c1e]'
              }`}
            >
              <span
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  n.read ? 'bg-ink/5 text-ink/30 dark:bg-white/10 dark:text-white/30' : 'bg-brand/10 text-brand'
                }`}
              >
                <Icon size={16} />
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
          );
        })}
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();

  // "Recent" is anything from the last 7 days — computed from the date
  // rather than a stored label, so notifications age into "Earlier" on
  // their own.
  const { recent, older } = useMemo(() => {
    const cutoff = Date.now() - WEEK_MS;
    return {
      recent: notifications.filter((n) => new Date(n.created_at).getTime() >= cutoff),
      older: notifications.filter((n) => new Date(n.created_at).getTime() < cutoff),
    };
  }, [notifications]);

  const open = (n) => {
    if (!n.read) markRead(n.id);
    // Only ever follow in-app links.
    if (typeof n.link === 'string' && n.link.startsWith('/') && !n.link.startsWith('//')) navigate(n.link);
  };

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
          <NotificationList title="Recent" list={recent} onOpen={open} />
          <NotificationList title="Earlier" list={older} onOpen={open} />
        </>
      )}
    </div>
  );
}

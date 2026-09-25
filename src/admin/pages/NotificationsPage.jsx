import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, Users as UsersIcon, CalendarClock } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useNotificationsStore, getNotifications, pushNotification, useUsersStore, getUsers } from '../lib/notificationsData';
import { useToast } from '../../context/ToastContext';

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const { notify } = useToast();

  const notifSnapshot = useNotificationsStore();
  const notifications = useMemo(() => getNotifications(), [notifSnapshot]);
  const usersSnapshot = useUsersStore();
  const users = useMemo(() => getUsers(), [usersSnapshot]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      notify('Add a title and message before sending.', 'warning');
      return;
    }
    setSending(true);
    try {
      const recipients = await pushNotification({ title: title.trim(), body: body.trim(), target });
      notify(
        `Notification sent to ${recipients} ${recipients === 1 ? 'user' : 'users'}.`,
        'success',
      );
      setTitle('');
      setBody('');
      setTarget('all');
    } catch (err) {
      notify(err.message || 'Could not send this notification.', 'warning');
    } finally {
      setSending(false);
    }
  };

  const sentToday = notifications.filter((n) => {
    const d = new Date(n.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Notifications</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Send a push notification to your users.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard label="Total Sent" value={notifications.length} icon={Bell} tone="brand" />
        <StatCard label="Sent Today" value={sentToday} icon={CalendarClock} tone="sky" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={handleSend} className="h-fit rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <Send size={15} className="text-brand" /> Compose
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Weekend picks near you"
                className="w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Write the notification body..."
                className="w-full resize-none rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Send to</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white"
              >
                <option value="all">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email}
                  </option>
                ))}
              </select>
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
            >
              <Send size={15} /> {sending ? 'Sending…' : 'Send notification'}
            </motion.button>
          </div>
        </form>

        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <Bell size={15} className="text-brand" /> Sent history
          </h2>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 && <p className="py-8 text-center text-xs text-ink/40 dark:text-white/40">Nothing sent yet.</p>}
            {notifications.map((n) => (
              <div key={n.id} className="rounded-xl border border-ink/8 p-3.5 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-ink dark:text-white">{n.title}</p>
                  <span className="shrink-0 text-xs text-ink/35 dark:text-white/35">{timeAgo(n.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{n.body}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-ink/35 dark:text-white/35">
                  <UsersIcon size={11} /> Sent to {n.count} {n.count === 1 ? 'recipient' : 'recipients'}
                  {n.target && n.target !== 'All Users' ? ` (${n.target})` : ''}
                  {n.sentBy ? ` · by ${n.sentBy}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

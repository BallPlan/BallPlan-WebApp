import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, Settings, LogOut, Flag } from 'lucide-react';
import { useAdminThemeStore, setAdminTheme } from '../../shared/store';
import { useActivityStore, getActivity } from '../lib/activityData';
import { useReportsStore, getReports } from '../lib/reportsData';
import { useAdminAuth } from '../context/AdminAuthContext';

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminTopHeader({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const theme = useAdminThemeStore();
  const { user: auth } = useAdminAuth();
  useActivityStore();
  useReportsStore();
  const activity = getActivity().slice(0, 6);
  const pendingCount = getReports().filter((r) => r.status === 'pending').length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/venues?q=${encodeURIComponent(query.trim())}`);
  };

  const initials = (auth?.email || 'A').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/8 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#15161a]/90 sm:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>

      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues..."
          className="w-full rounded-full bg-ink/5 py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:ring-2 focus:ring-brand/30 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setAdminTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {pendingCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-card-hover dark:bg-[#1e1f24]"
              >
                <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-bold text-ink dark:text-white">Activity</p>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => {
                        navigate('/reports');
                        setNotifOpen(false);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-brand"
                    >
                      <Flag size={12} /> {pendingCount} pending
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {activity.length === 0 && <p className="p-4 text-center text-xs text-ink/40">No activity yet.</p>}
                  {activity.map((a) => (
                    <div key={a.id} className="border-b border-ink/5 px-4 py-2.5 text-xs last:border-0 dark:border-white/5">
                      <p className="text-ink/80 dark:text-white/80">{a.message}</p>
                      <p className="mt-0.5 text-ink/35 dark:text-white/35">{timeAgo(a.time)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-ink/5 dark:hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-sm font-semibold text-ink dark:text-white sm:block">
              {auth?.email?.split('@')[0] || 'Admin'}
            </span>
            <ChevronDown size={14} className="hidden text-ink/40 dark:text-white/40 sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl bg-white p-1.5 shadow-card-hover dark:bg-[#1e1f24]"
              >
                <p className="truncate px-3 py-2 text-xs text-ink/40 dark:text-white/40">{auth?.email}</p>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 dark:text-white/70 dark:hover:bg-white/10"
                >
                  <Settings size={15} /> Settings
                </button>
                <button
                  onClick={() => {
                    navigate('/logout');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={15} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAgentAuth } from '../context/AgentAuthContext';

export default function AgentTopHeader({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAgentAuth();

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email?.split('@')[0] || 'Agent';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/8 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#15161a]/90 sm:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-ink/5 dark:hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-sm font-semibold text-ink dark:text-white sm:block">{displayName}</span>
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
                <p className="truncate px-3 py-2 text-xs text-ink/40 dark:text-white/40">{user?.email}</p>
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

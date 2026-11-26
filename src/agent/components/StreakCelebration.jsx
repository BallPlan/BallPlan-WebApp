import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, X } from 'lucide-react';
import { useAgentAuth } from '../context/AgentAuthContext';
import { fetchMyDays, STREAK_EVENT } from '../lib/streakData';
import { computeStreak, dayKey, shiftDay } from '../../utils/streak';

// The "Streak started / Streak continues — Day N" popup. Shown when the
// agent signs in, and after they add or edit a venue (see celebrateStreak).
const WEEKDAY = (key) => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' });

export default function StreakCelebration() {
  const { user } = useAgentAuth();
  const navigate = useNavigate();
  const [shown, setShown] = useState(null); // { kind, venueName, streak, week }

  useEffect(() => {
    const onEvent = async (e) => {
      if (!user?.id) return;
      try {
        const days = await fetchMyDays(user.id);
        const keys = days.map((d) => d.day);
        // The visit that triggered this was just recorded, so today counts.
        const today = dayKey();
        if (!keys.includes(today)) keys.push(today);
        const streak = computeStreak(keys);
        const set = new Set(keys);
        const week = Array.from({ length: 7 }, (_, i) => {
          const key = shiftDay(today, i - 6);
          return { key, on: set.has(key) };
        });
        setShown({ ...e.detail, streak, week });
      } catch {
        /* activity not available (e.g. database not updated yet): no popup */
      }
    };
    window.addEventListener(STREAK_EVENT, onEvent);
    return () => window.removeEventListener(STREAK_EVENT, onEvent);
  }, [user?.id]);

  const close = () => setShown(null);
  const n = shown?.streak.current || 1;
  const started = n === 1;
  const firstName = user?.first_name || user?.firstName;

  const lead = !shown
    ? ''
    : shown.kind === 'added'
      ? `“${shown.venueName}” added.`
      : shown.kind === 'edited'
        ? `“${shown.venueName}” updated.`
        : firstName
          ? `Welcome back, ${firstName}!`
          : 'Welcome back!';

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={started ? 'Streak started' : `Streak day ${n}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-card-hover dark:bg-[#1c1c1e]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            >
              <X size={16} />
            </button>

            <div className="relative bg-gradient-to-br from-brand-light via-brand to-brand-dark px-6 pb-7 pt-9 text-white">
              <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-white/10" />
              <motion.span
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: [0.4, 1.15, 1], rotate: [-20, 8, 0] }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/25"
              >
                <Flame size={44} className="fill-amber-300 text-amber-200" />
              </motion.span>
              <p className="relative mt-3 text-sm font-semibold uppercase tracking-widest text-white/80">
                {started ? 'Streak started' : 'Streak continues'}
              </p>
              <p className="relative font-display text-5xl font-extrabold leading-tight">Day {n}</p>
            </div>

            <div className="px-6 pb-6 pt-5">
              <p className="text-sm font-semibold text-ink dark:text-white">{lead}</p>
              <p className="mt-1 text-sm text-ink/55 dark:text-white/55">
                {started
                  ? 'You’ve started a streak. Come back tomorrow to keep it going!'
                  : `That’s ${n} days in a row. Keep it up!`}
              </p>

              <div className="mt-5 flex justify-center gap-2">
                {shown.week.map((d) => (
                  <div key={d.key} className="flex flex-col items-center gap-1">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        d.on ? 'bg-brand text-white' : 'bg-ink/5 text-ink/25 dark:bg-white/5 dark:text-white/25'
                      } ${d.key === dayKey() ? 'ring-2 ring-brand/30 ring-offset-2 dark:ring-offset-[#1c1c1e]' : ''}`}
                    >
                      <Flame size={14} className={d.on ? 'fill-white/40' : ''} />
                    </span>
                    <span className="text-[10px] font-semibold text-ink/40 dark:text-white/40">{WEEKDAY(d.key)}</span>
                  </div>
                ))}
              </div>
              {shown.streak.longest > n && (
                <p className="mt-3 text-xs text-ink/45 dark:text-white/45">Your best so far: {shown.streak.longest} days</p>
              )}

              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    navigate('/streak');
                  }}
                  className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
                >
                  View streak
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
                >
                  Keep going
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

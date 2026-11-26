import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, PlusCircle, Pencil, ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react';
import StatCard from '../../admin/components/StatCard';
import DayMark from '../../components/DayMark';
import { useAgentAuth } from '../context/AgentAuthContext';
import { fetchMyDays, STREAK_EVENT } from '../lib/streakData';
import { computeStreak, dayKey, shiftDay } from '../../utils/streak';

// The agent's own streak: current/best streak, a month calendar of active
// days, and a day-by-day log (signed in / added venue / edited venue).
const TZ = 'Africa/Lagos';
const fmtDay = (key) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Names({ list }) {
  if (!list?.length) return null;
  return (
    <p className="mt-1 max-w-[200px] truncate text-[11px] text-ink/45 dark:text-white/45" title={list.join(', ')}>
      {list.join(', ')}
    </p>
  );
}

export default function AgentStreak() {
  const { user } = useAgentAuth();
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const today = dayKey();
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM shown in the calendar

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchMyDays(user?.id)
        .then((d) => !cancelled && (setDays(d), setError(null)))
        .catch((e) => !cancelled && (setDays([]), setError(e.message)));
    load();
    // Refresh when something new happens (sign-in, venue saved).
    window.addEventListener(STREAK_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(STREAK_EVENT, load);
    };
  }, [user?.id]);

  const byDay = useMemo(() => Object.fromEntries((days || []).map((d) => [d.day, d])), [days]);
  const streak = useMemo(() => {
    const keys = Object.keys(byDay);
    if (!keys.includes(today)) keys.push(today); // you're here now, so today counts
    return computeStreak(keys);
  }, [byDay, today]);
  const active = (key) => key === today || !!byDay[key];
  // Days before the account existed aren't "missed".
  const joined = user?.created_at ? dayKey(new Date(user.created_at)) : null;
  const beforeJoin = (key) => joined && key < joined;

  const totals = useMemo(
    () => ({
      added: (days || []).reduce((n, d) => n + (d.added?.length || 0), 0),
      edited: (days || []).reduce((n, d) => n + (d.edited?.length || 0), 0),
    }),
    [days],
  );

  // Month calendar (Monday-first), days after today left blank.
  const calendar = useMemo(() => {
    const first = `${month}-01`;
    const startDow = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
    const cells = Array.from({ length: startDow }, () => null);
    for (let k = first; k.startsWith(month); k = shiftDay(k, 1)) cells.push(k);
    return cells;
  }, [month]);
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const moveMonth = (delta) => {
    const d = new Date(`${month}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
  };

  // Last 30 days, newest first.
  const log = useMemo(
    () => Array.from({ length: 30 }, (_, i) => shiftDay(today, -i)).filter((k) => !beforeJoin(k)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, joined],
  );

  if (!days) {
    return (
      <div className="flex justify-center py-24 text-ink/40">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  const n = streak.current;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Streak</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
        Sign in or work on your venues every day to keep your streak going.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Your activity couldn’t be loaded right now. Please try again later.
        </p>
      )}

      {/* Hero */}
      <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-light via-brand to-brand-dark p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/25">
              <Flame size={44} className="fill-amber-300 text-amber-200" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/75">Current streak</p>
              <p className="font-display text-5xl font-extrabold leading-tight">
                {n} day{n === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-sm text-white/85">
                {n <= 1 ? 'Streak started! Come back tomorrow to make it 2.' : `You’ve been active ${n} days in a row.`}
              </p>
            </div>
          </div>
          {/* This week */}
          <div className="flex gap-2">
            {Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6)).map((key) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    active(key) ? 'bg-white text-brand' : 'bg-white/15 text-white/50'
                  } ${key === today ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-brand' : ''}`}
                >
                  <Flame size={16} className={active(key) ? 'fill-brand/30' : ''} />
                </span>
                <span className="text-[10px] font-semibold text-white/70">
                  {new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Best streak (days)" value={streak.longest} icon={Trophy} tone="amber" />
        <StatCard label="Days active" value={streak.totalDays} icon={CalendarCheck} tone="emerald" />
        <StatCard label="Venues added" value={totals.added} icon={PlusCircle} />
        <StatCard label="Venue edits" value={totals.edited} icon={Pencil} tone="sky" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
        {/* Calendar */}
        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-bold text-ink dark:text-white">{monthLabel}</h2>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              disabled={month >= today.slice(0, 7)}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 disabled:opacity-30 dark:text-white/50 dark:hover:bg-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
            {WEEK_HEAD.map((d) => (
              <span key={d} className="pb-1 text-[10px] font-bold uppercase text-ink/35 dark:text-white/35">
                {d}
              </span>
            ))}
            {calendar.map((key, i) =>
              !key ? (
                <span key={`b${i}`} />
              ) : (
                <span
                  key={key}
                  title={fmtDay(key)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold ${
                    key > today || beforeJoin(key)
                      ? 'text-ink/20 dark:text-white/20'
                      : active(key)
                        ? 'bg-brand text-white'
                        : 'bg-red-50 text-red-400 dark:bg-red-500/10 dark:text-red-400/80'
                  } ${key === today ? 'ring-2 ring-brand/40 ring-offset-2 dark:ring-offset-[#1a1b20]' : ''}`}
                >
                  {Number(key.slice(8))}
                  {key <= today && !beforeJoin(key) && (active(key) ? <Flame size={10} className="mt-0.5 fill-white/40" /> : <span className="text-[9px] leading-none">✕</span>)}
                </span>
              ),
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-ink/50 dark:text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-brand" /> Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-100 dark:bg-red-500/20" /> Missed
            </span>
          </div>
        </div>

        {/* Daily log */}
        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <CalendarDays size={16} className="text-brand" /> Last 30 days
          </h2>
          <div className="mt-3 max-h-[520px] overflow-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="sticky top-0 bg-white dark:bg-[#1a1b20]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Signed in</th>
                  <th className="pb-2 font-semibold">Added venue</th>
                  <th className="pb-2 font-semibold">Edited venue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                {log.map((key) => {
                  const row = byDay[key];
                  return (
                    <tr key={key} className={active(key) ? '' : 'opacity-70'}>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-ink dark:text-white">{key === today ? 'Today' : fmtDay(key)}</p>
                        {row && <p className="text-[11px] text-ink/45 dark:text-white/45">from {fmtTime(row.first_seen)}</p>}
                      </td>
                      <td className="py-2.5">
                        <DayMark on={active(key)} label="Signed in" />
                      </td>
                      <td className="py-2.5">
                        <DayMark on={!!row?.added?.length} label="Added venue" />
                        <Names list={row?.added} />
                      </td>
                      <td className="py-2.5">
                        <DayMark on={!!row?.edited?.length} label="Edited venue" />
                        <Names list={row?.edited} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

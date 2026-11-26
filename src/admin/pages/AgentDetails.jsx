import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  UtensilsCrossed,
  Ticket,
  Globe,
  CalendarDays,
  Flame,
  Loader2,
  Mail,
  Trophy,
  Activity,
  TrendingUp,
} from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import DayMark from '../../components/DayMark';
import { dayKey, computeStreak, shiftDay } from '../../utils/streak';
import { rankAgents, ACTIVE_WINDOW_DAYS, POINTS } from '../lib/agentRanking';
import StatCard from '../components/StatCard';
import { useStaffStore, getAgents } from '../lib/staffData';
import { useVenuesStore, getVenues } from '../lib/venuesData';
import { supabase } from '../lib/supabaseClient';

// Settings > Agents > View details: what one agent has uploaded (venues and
// their menu/activity counts) and, day by day, whether they signed in and
// added or edited venues. Daily rows come from staff_daily_activity (see the
// 20261126000000_staff_daily_activity migration); a day with no row means
// they weren't signed in.
const RANGES = [7, 30, 90];
const TZ = 'Africa/Lagos';

const fmtDay = (key) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '—');
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

function Names({ list }) {
  if (!list?.length) return null;
  return <p className="mt-1 max-w-[220px] truncate text-[11px] text-ink/45 dark:text-white/45" title={list.join(', ')}>{list.join(', ')}</p>;
}

export default function AgentDetails() {
  const { id } = useParams();
  const staffSnapshot = useStaffStore();
  const venuesSnapshot = useVenuesStore();
  const agent = useMemo(() => getAgents().find((a) => a.id === id), [id, staffSnapshot]);
  const venues = useMemo(() => getVenues().filter((v) => v.createdBy === id), [id, venuesSnapshot]);

  const [range, setRange] = useState(30);
  const [days, setDays] = useState(null); // rows from staff_daily_activity
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDays(null);
    setLoadError(null);
    supabase
      .from('staff_daily_activity')
      .select('day, added, edited, first_seen, last_seen')
      .eq('user_id', id)
      .order('day', { ascending: false })
      .limit(400)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setLoadError(error.message);
        setDays(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totals = useMemo(
    () => ({
      venues: venues.length,
      published: venues.filter((v) => v.published !== false).length,
      menu: venues.reduce((n, v) => n + v.menu.length, 0),
      activities: venues.reduce((n, v) => n + v.activities.length, 0),
    }),
    [venues],
  );

  // One row per calendar day in the chosen range (newest first), never
  // earlier than the day the account was created.
  const timeline = useMemo(() => {
    if (!days) return [];
    const byDay = Object.fromEntries(days.map((d) => [d.day, d]));
    const createdKey = agent?.created_at ? dayKey(new Date(agent.created_at)) : null;
    const out = [];
    for (let i = 0; i < range; i += 1) {
      const key = dayKey(new Date(Date.now() - i * 86_400_000));
      if (createdKey && key < createdKey) break;
      out.push({ key, row: byDay[key] || null });
    }
    return out;
  }, [days, range, agent]);

  const summary = useMemo(
    () => ({
      signedIn: timeline.filter((d) => d.row).length,
      added: timeline.filter((d) => d.row?.added?.length).length,
      edited: timeline.filter((d) => d.row?.edited?.length).length,
    }),
    [timeline],
  );
  const lastActive = days?.[0]?.last_seen;
  const streak = useMemo(() => computeStreak((days || []).map((d) => d.day)), [days]);

  // Every agent's recent days, to rank this agent against the others.
  const [allDays, setAllDays] = useState(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('staff_daily_activity')
      .select('user_id, day')
      .gte('day', shiftDay(dayKey(), -120))
      .limit(10000)
      .then(({ data }) => !cancelled && setAllDays(data || []));
    return () => {
      cancelled = true;
    };
  }, []);
  const ranking = useMemo(
    () => (allDays ? rankAgents(getAgents(), getVenues(), allDays) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allDays, staffSnapshot, venuesSnapshot],
  );
  const me = ranking?.find((a) => a.id === id);

  if (!agent) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-ink dark:text-white">Agent not found.</p>
        <Link to="/settings?tab=team" className="mt-4 inline-block text-brand hover:underline">
          Back to Agents
        </Link>
      </div>
    );
  }

  const name = [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.email;
  const suspended = agent.status === 'suspended';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/settings?tab=team"
          aria-label="Back to Agents"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-brand hover:text-white dark:bg-[#1a1b20]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-ink dark:text-white">Agent details</h1>
          <p className="text-sm text-ink/50 dark:text-white/50">Uploads and daily activity</p>
        </div>
      </div>

      {/* Profile */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20] sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
          {agent.first_name?.[0]}
          {agent.last_name?.[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-bold text-ink dark:text-white">{name}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                suspended
                  ? 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
              }`}
            >
              {suspended ? 'Suspended' : 'Active'}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink/50 dark:text-white/50">
            <Mail size={13} /> {agent.email}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:text-right">
          <span className="text-ink/45 dark:text-white/45">Joined</span>
          <span className="font-semibold text-ink dark:text-white">{fmtDate(agent.created_at)}</span>
          <span className="text-ink/45 dark:text-white/45">Streak</span>
          <span className="flex items-center gap-1 font-semibold text-ink dark:text-white sm:justify-end">
            <Flame size={14} className="text-brand" />
            {days ? `${streak.current} day${streak.current === 1 ? '' : 's'}` : '…'}
          </span>
          <span className="text-ink/45 dark:text-white/45">Ranking</span>
          <span className="flex items-center gap-1 font-semibold text-ink dark:text-white sm:justify-end">
            <Trophy size={14} className="text-amber-500" />
            {me ? `#${me.overallRank} of ${ranking.length} overall` : '…'}
          </span>
          <span className="text-ink/45 dark:text-white/45">Last active</span>
          <span className="font-semibold text-ink dark:text-white">
            {lastActive ? `${fmtDate(lastActive)}, ${fmtTime(lastActive)}` : days ? 'Not yet' : '…'}
          </span>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Venues uploaded" value={totals.venues} icon={Building2} />
        <StatCard label="Published venues" value={totals.published} icon={Globe} tone="emerald" />
        <StatCard label="Menu items" value={totals.menu} icon={UtensilsCrossed} tone="amber" />
        <StatCard label="Activities" value={totals.activities} icon={Ticket} tone="sky" />
      </div>

      {/* Ranking */}
      {me && (
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <Trophy size={16} className="text-amber-500" /> Agent ranking
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Overall', rank: me.overallRank, icon: Trophy, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', note: `${me.points} points (activity + performance)` },
              { label: 'Most active', rank: me.activeRank, icon: Activity, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', note: `${me.activityPoints} pts · ${me.activeDays}/${ACTIVE_WINDOW_DAYS} days active, ${me.streak}-day streak` },
              { label: 'Best performing', rank: me.performanceRank, icon: TrendingUp, tone: 'bg-brand/10 text-brand', note: `${me.performancePoints} pts · ${me.venues} venue${me.venues === 1 ? '' : 's'}, ${me.items} items` },
            ].map(({ label, rank, icon: Icon, tone, note }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-cream p-4 dark:bg-white/5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink/50 dark:text-white/50">{label}</p>
                  <p className="text-xl font-extrabold text-ink dark:text-white">
                    #{rank} <span className="text-xs font-semibold text-ink/40 dark:text-white/40">of {ranking.length}</span>
                  </p>
                  <p className="truncate text-[11px] text-ink/45 dark:text-white/45">{note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                  <th className="pb-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">Agent</th>
                  <th className="pb-2 text-center font-semibold">Points</th>
                  <th className="pb-2 text-center font-semibold">Active days ({ACTIVE_WINDOW_DAYS}d)</th>
                  <th className="pb-2 text-center font-semibold">Streak</th>
                  <th className="pb-2 text-center font-semibold">Venues</th>
                  <th className="pb-2 text-center font-semibold">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                {ranking.map((a) => (
                  <tr key={a.id} className={a.id === id ? 'bg-brand/5 dark:bg-brand/10' : ''}>
                    <td className="py-2.5 pl-2 pr-3 font-extrabold text-ink dark:text-white">
                      {a.overallRank === 1 ? '🥇' : a.overallRank === 2 ? '🥈' : a.overallRank === 3 ? '🥉' : a.overallRank}
                    </td>
                    <td className="py-2.5 pr-3">
                      {a.id === id ? (
                        <span className="font-bold text-brand">{a.name} (this agent)</span>
                      ) : (
                        <Link to={`/agents/${a.id}`} className="font-semibold text-ink hover:text-brand dark:text-white">
                          {a.name}
                        </Link>
                      )}
                      {a.status === 'suspended' && <span className="ml-2 text-[11px] font-bold text-red-500">Suspended</span>}
                    </td>
                    <td className="py-2.5 text-center font-extrabold text-brand">{a.points}</td>
                    <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.activeDays}</td>
                    <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.streak}</td>
                    <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.venues}</td>
                    <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-ink/40 dark:text-white/40">
            Points: +{POINTS.venue} per venue, +{POINTS.item} per menu item or activity (best performing), +{POINTS.activeDay} per
            active day in the last {ACTIVE_WINDOW_DAYS} days and +{POINTS.streakDay} per day of current streak (most active).
            Overall = all points.
          </p>
        </div>
      )}

      {/* Venues */}
      <div className="mt-5 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <h2 className="text-sm font-bold text-ink dark:text-white">Venues uploaded</h2>
        {venues.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40 dark:text-white/40">This agent hasn’t uploaded any venues yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                  <th className="pb-2 font-semibold">Venue</th>
                  <th className="pb-2 text-center font-semibold">Menu items</th>
                  <th className="pb-2 text-center font-semibold">Activities</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Added</th>
                  <th className="pb-2 font-semibold">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                {venues.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 pr-3">
                      <Link to={`/venues/${v.id}`} className="flex min-w-0 items-center gap-3">
                        <ImageWithFallback src={v.hero} seed={v.id} alt={v.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-ink hover:text-brand dark:text-white">{v.name}</span>
                          <span className="block truncate text-xs text-ink/45 dark:text-white/45">{v.category}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 text-center font-bold text-ink dark:text-white">{v.menu.length}</td>
                    <td className="py-3 text-center font-bold text-ink dark:text-white">{v.activities.length}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          v.published === false
                            ? 'bg-ink/5 text-ink/50 dark:bg-white/10 dark:text-white/50'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                        }`}
                      >
                        {v.published === false ? 'Unpublished' : 'Published'}
                      </span>
                    </td>
                    <td className="py-3 text-ink/60 dark:text-white/60">{fmtDate(v.createdAt)}</td>
                    <td className="py-3 text-ink/60 dark:text-white/60">{fmtDate(v.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink/10 dark:border-white/10">
                  <td className="pt-3 text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-white/45">Total</td>
                  <td className="pt-3 text-center font-extrabold text-brand">{totals.menu}</td>
                  <td className="pt-3 text-center font-extrabold text-brand">{totals.activities}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Daily activity */}
      <div className="mt-5 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <CalendarDays size={16} className="text-brand" /> Daily activity
          </h2>
          <div className="flex gap-1 rounded-full bg-ink/5 p-1 dark:bg-white/5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  range === r ? 'bg-brand text-white' : 'text-ink/50 hover:text-ink dark:text-white/50 dark:hover:text-white'
                }`}
              >
                {r} days
              </button>
            ))}
          </div>
        </div>

        {!days ? (
          <div className="flex justify-center py-10 text-ink/40">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : loadError ? (
          <p className="py-8 text-center text-sm text-amber-600">
            Couldn’t load activity ({loadError}). If this is new, the database update may not have been run yet.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Days signed in', summary.signedIn],
                ['Days adding venues', summary.added],
                ['Days editing venues', summary.edited],
              ].map(([label, n]) => (
                <div key={label} className="rounded-xl bg-cream px-2 py-3 dark:bg-white/5">
                  <p className="text-lg font-extrabold text-ink dark:text-white">
                    {n}
                    <span className="text-xs font-semibold text-ink/40 dark:text-white/40"> / {timeline.length}</span>
                  </p>
                  <p className="text-[11px] font-medium text-ink/50 dark:text-white/50">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Signed in</th>
                    <th className="pb-2 font-semibold">Added venue</th>
                    <th className="pb-2 font-semibold">Edited venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                  {timeline.map(({ key, row }) => (
                    <tr key={key} className={row ? '' : 'opacity-70'}>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-ink dark:text-white">{fmtDay(key)}</p>
                        {row && (
                          <p className="text-[11px] text-ink/45 dark:text-white/45">
                            {fmtTime(row.first_seen)}
                            {row.last_seen !== row.first_seen ? ` – ${fmtTime(row.last_seen)}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5">
                        <DayMark on={!!row} label="Signed in" />
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
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-ink/40 dark:text-white/40">
              Days are in Lagos time. Times show when the agent was first and last seen in their dashboard that day.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

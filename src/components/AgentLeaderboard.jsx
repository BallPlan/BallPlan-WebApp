import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Activity, TrendingUp, Loader2, Lightbulb, ChevronDown } from 'lucide-react';
import { rankAgentStats, ACTIVE_WINDOW_DAYS } from '../admin/lib/agentRanking';

// Agent leaderboard for the dashboards. Data comes from the
// get_agent_leaderboard() database function (works for admin, support and
// agents alike).
//   mode="staff": every agent, names link to their Agent details page.
//   mode="agent": active agents only, the viewer's row is highlighted, and
//                 their own ranks plus tips on where to improve are shown.
const TOP = 10;

const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Initials({ agent, highlight }) {
  const letters = agent.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return agent.avatarUrl ? (
    <img src={agent.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        highlight ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
      }`}
    >
      {letters}
    </span>
  );
}

// Plain-language tips: what this agent needs to do to move up.
function improvementTips(me, list) {
  const tips = [];
  const leaderActive = Math.max(...list.map((a) => a.activeDays));
  if (me.activeRank === 1) {
    tips.push(`You’re the most active agent. Keep signing in every day to stay on top.`);
  } else {
    const above = list.filter((a) => a.activeRank < me.activeRank).sort((a, b) => b.activeRank - a.activeRank)[0];
    const gap = Math.max(1, (above?.activeDays ?? leaderActive) - me.activeDays);
    tips.push(
      `Be more active: you’ve been active ${me.activeDays} of the last ${ACTIVE_WINDOW_DAYS} days. About ${plural(gap, 'more day')} would move you up (the most active agent has ${leaderActive}).`,
    );
  }
  if (me.performanceRank === 1) {
    tips.push('You’re the best performer. Keep adding venues and full menus to stay ahead.');
  } else {
    const above = list.filter((a) => a.performanceRank < me.performanceRank).sort((a, b) => b.performanceRank - a.performanceRank)[0];
    if (above && above.venues > me.venues) {
      tips.push(
        `Upload more venues: you have ${plural(me.venues, 'venue')}. ${plural(above.venues - me.venues, 'more venue')} would move you up.`,
      );
    } else if (above) {
      tips.push(
        `Add more menu items and activities to your venues: you have ${me.items}. ${plural(Math.max(1, above.items - me.items + 1), 'more item')} would move you up.`,
      );
    }
  }
  if (me.streak < 2) tips.push('Start a streak: open your dashboard every day, even just to check your venues.');
  return tips;
}

export default function AgentLeaderboard({ client, mode = 'staff', currentUserId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client.rpc('get_agent_leaderboard').then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      setRows(data || []);
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const ranking = useMemo(() => {
    if (!rows) return null;
    const stats = rows
      .filter((r) => mode === 'staff' || r.status !== 'suspended')
      .map((r) => ({
        id: r.id,
        name: r.name || 'Agent',
        avatarUrl: r.avatar_url,
        status: r.status,
        days: r.days || [],
        venues: Number(r.venues) || 0,
        items: Number(r.items) || 0,
        views: Number(r.views) || 0,
      }));
    return rankAgentStats(stats);
  }, [rows, mode]);

  const me = ranking?.find((a) => a.id === currentUserId);
  const visible = useMemo(() => {
    if (!ranking) return [];
    if (showAll || ranking.length <= TOP) return ranking;
    const top = ranking.slice(0, TOP);
    return me && !top.includes(me) ? [...top, me] : top;
  }, [ranking, showAll, me]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
          <Trophy size={16} className="text-amber-500" /> Agent leaderboard
        </h2>
        {ranking && <span className="text-xs text-ink/40 dark:text-white/40">{plural(ranking.length, 'agent')}</span>}
      </div>

      {!rows ? (
        <div className="flex justify-center py-10 text-ink/40">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-ink/45 dark:text-white/45">The leaderboard isn’t available right now.</p>
      ) : ranking.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/45 dark:text-white/45">No agents yet.</p>
      ) : (
        <>
          {mode === 'agent' && me && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Your overall rank', rank: me.overallRank, icon: Trophy, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
                  { label: 'Most active', rank: me.activeRank, icon: Activity, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
                  { label: 'Best performing', rank: me.performanceRank, icon: TrendingUp, tone: 'bg-brand/10 text-brand' },
                ].map(({ label, rank, icon: Icon, tone }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-cream p-3.5 dark:bg-white/5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink/50 dark:text-white/50">{label}</p>
                      <p className="text-lg font-extrabold text-ink dark:text-white">
                        #{rank} <span className="text-xs font-semibold text-ink/40 dark:text-white/40">of {ranking.length}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <Lightbulb size={14} /> How to move up
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink/70 dark:text-white/70">
                  {improvementTips(me, ranking).map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-white/40">
                  <th className="pb-2 pl-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">Agent</th>
                  <th className="pb-2 text-center font-semibold">Active days ({ACTIVE_WINDOW_DAYS}d)</th>
                  <th className="pb-2 text-center font-semibold">Streak</th>
                  <th className="pb-2 text-center font-semibold">Venues</th>
                  <th className="pb-2 text-center font-semibold">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                {visible.map((a) => {
                  const isMe = a.id === currentUserId;
                  return (
                    <tr key={a.id} className={isMe ? 'bg-brand/5 dark:bg-brand/10' : ''}>
                      <td className="w-10 py-2.5 pl-2 text-base font-extrabold text-ink dark:text-white">{medal(a.overallRank)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Initials agent={a} highlight={isMe} />
                          {mode === 'staff' ? (
                            <Link to={`/agents/${a.id}`} className="truncate font-semibold text-ink hover:text-brand dark:text-white">
                              {a.name}
                            </Link>
                          ) : (
                            <span className={`truncate font-semibold ${isMe ? 'text-brand' : 'text-ink dark:text-white'}`}>
                              {a.name}
                              {isMe && ' (you)'}
                            </span>
                          )}
                          {a.status === 'suspended' && <span className="text-[11px] font-bold text-red-500">Suspended</span>}
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.activeDays}</td>
                      <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.streak > 0 ? `🔥 ${a.streak}` : '0'}</td>
                      <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.venues}</td>
                      <td className="py-2.5 text-center text-ink/70 dark:text-white/70">{a.items}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {ranking.length > TOP && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mx-auto mt-3 flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              {showAll ? 'Show top 10' : `Show all ${ranking.length} agents`}
              <ChevronDown size={14} className={showAll ? 'rotate-180' : ''} />
            </button>
          )}
          <p className="mt-3 text-[11px] text-ink/40 dark:text-white/40">
            Ranked on activity (days active in the last {ACTIVE_WINDOW_DAYS} days) and performance (venues uploaded, then menu
            items &amp; activities) combined.
          </p>
        </>
      )}
    </div>
  );
}

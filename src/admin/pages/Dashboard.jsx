import { useEffect, useMemo, useState } from 'react';
import {
  Store,
  UtensilsCrossed,
  Tag,
  Flag,
  Activity,
  Users as UsersIcon,
  Star,
  Bell,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import VisitorLineChart from '../components/VisitorLineChart';
import { useVenuesStore, getVenues, useCategoriesStore, getCategories } from '../lib/venuesData';
import { useReportsStore, getReports } from '../lib/reportsData';
import { useActivityStore, getActivity, refreshActivity } from '../lib/activityData';
import { fetchVisitorSeries } from '../lib/analyticsData';
import { useAdminThemeStore } from '../../shared/store';

const RANGES = ['Day', 'Week', 'Month'];
const RANGE_PHRASE = { Day: 'in the last 24 hours', Week: 'in the last 7 days', Month: 'in the last 12 months' };

const KIND_ICON = {
  venue: Store,
  price: Tag,
  category: Tag,
  report: Flag,
  user: UsersIcon,
  review: Star,
  notification: Bell,
  waitlist: ClipboardList,
  staff: ShieldCheck,
};

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const [range, setRange] = useState('Week');
  const [visitors, setVisitors] = useState(null); // { points, totalVisitors, totalViews }
  const [visitorsError, setVisitorsError] = useState('');
  const theme = useAdminThemeStore();

  useVenuesStore();
  useCategoriesStore();
  useReportsStore();
  useActivityStore();

  const venues = getVenues();
  const categories = getCategories();
  const reports = getReports();
  const activity = getActivity();

  const totalMenuItems = useMemo(() => venues.reduce((sum, v) => sum + (v.menu?.length || 0), 0), [venues]);
  const pendingReports = reports.filter((r) => r.status === 'pending').length;

  // Real visitor numbers, refreshed when the range changes and once a
  // minute after that.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchVisitorSeries(range)
        .then((series) => {
          if (cancelled) return;
          setVisitors(series);
          setVisitorsError('');
        })
        .catch((err) => {
          if (!cancelled) setVisitorsError(err.message || 'Could not load visitor data.');
        });
    };
    setVisitors(null);
    load();
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [range]);

  useEffect(() => {
    refreshActivity();
  }, []);

  const chartData = visitors?.points ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Welcome back — here's what's happening across BallPlan.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Venues" value={venues.length} icon={Store} tone="brand" />
        <StatCard label="Total Menu Items" value={totalMenuItems} icon={UtensilsCrossed} tone="sky" />
        <StatCard label="Total Categories" value={categories.length} icon={Tag} tone="emerald" />
        <StatCard label="Pending Reports" value={pendingReports} icon={Flag} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-white">Website visitors</h2>
              <p className="text-xs text-ink/40 dark:text-white/40">
                {visitors
                  ? `${visitors.totalVisitors.toLocaleString()} visitor${visitors.totalVisitors === 1 ? '' : 's'} · ${visitors.totalViews.toLocaleString()} page view${visitors.totalViews === 1 ? '' : 's'} ${RANGE_PHRASE[range]}`
                  : visitorsError
                  ? 'Could not load visitor data.'
                  : 'Loading…'}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-ink/5 p-1 dark:bg-white/10">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    range === r ? 'bg-brand text-white dark:bg-brand dark:text-white' : 'text-ink/50 dark:text-white/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {chartData.length > 0 ? (
              <VisitorLineChart data={chartData} dark={theme === 'dark'} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-xs text-ink/40 dark:text-white/40">
                {visitorsError || 'Loading…'}
              </div>
            )}
          </div>
          {visitors && visitors.totalViews === 0 && (
            <p className="mt-2 text-center text-xs text-ink/40 dark:text-white/40">
              No visits recorded {RANGE_PHRASE[range]} yet — visitors show up here as soon as people open the site.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand" />
            <h2 className="text-sm font-bold text-ink dark:text-white">Recent activity</h2>
          </div>
          <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 && <p className="py-8 text-center text-xs text-ink/40 dark:text-white/40">No activity yet.</p>}
            {activity.slice(0, 20).map((a) => {
              const Icon = KIND_ICON[a.kind] || Activity;
              return (
                <div key={a.id} className="flex items-start gap-2.5 border-b border-ink/5 pb-3 last:border-0 dark:border-white/5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink/80 dark:text-white/80">{a.message}</p>
                    <p className="mt-0.5 text-xs text-ink/35 dark:text-white/35">{timeAgo(a.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

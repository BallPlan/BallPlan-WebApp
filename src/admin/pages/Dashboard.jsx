import { useMemo, useState } from 'react';
import { Store, UtensilsCrossed, Tag, Flag, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import VisitorLineChart from '../components/VisitorLineChart';
import {
  useVenuesStore,
  getVenues,
  useCategoriesStore,
  getCategories,
  useReportsStore,
  getReports,
  useActivityStore,
  getActivity,
  getVisitorStats,
  useAdminThemeStore,
} from '../../shared/store';

const RANGES = ['Day', 'Week', 'Month'];

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildChartData(stats, range) {
  if (range === 'Day') {
    return stats.hourly.map((d) => ({
      label: new Date(d.date).toLocaleTimeString('en-US', { hour: 'numeric' }),
      count: d.count,
    }));
  }
  if (range === 'Week') {
    return stats.daily.slice(-7).map((d) => ({
      label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: d.count,
    }));
  }
  // Month: aggregate daily into the last 12 calendar months
  const buckets = new Map();
  stats.daily.forEach((d) => {
    const date = new Date(d.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    buckets.set(key, (buckets.get(key) || 0) + d.count);
  });
  return Array.from(buckets.entries())
    .slice(-12)
    .map(([key, count]) => {
      const [y, m] = key.split('-').map(Number);
      return { label: new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short' }), count };
    });
}

export default function Dashboard() {
  const [range, setRange] = useState('Week');
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

  const chartData = useMemo(() => buildChartData(getVisitorStats(), range), [range]);
  const totalVisitorsInRange = chartData.reduce((sum, d) => sum + d.count, 0);

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
                {totalVisitorsInRange.toLocaleString()} visitors this {range.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-ink/5 p-1 dark:bg-white/10">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    range === r ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-ink/50 dark:text-white/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <VisitorLineChart data={chartData} dark={theme === 'dark'} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand" />
            <h2 className="text-sm font-bold text-ink dark:text-white">Recent activity</h2>
          </div>
          <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 && <p className="py-8 text-center text-xs text-ink/40 dark:text-white/40">No activity yet.</p>}
            {activity.slice(0, 12).map((a) => (
              <div key={a.id} className="border-b border-ink/5 pb-3 last:border-0 dark:border-white/5">
                <p className="text-sm text-ink/80 dark:text-white/80">{a.message}</p>
                <p className="mt-0.5 text-xs text-ink/35 dark:text-white/35">{timeAgo(a.time)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

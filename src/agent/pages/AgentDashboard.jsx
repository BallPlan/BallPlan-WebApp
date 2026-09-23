import { useEffect, useMemo, useState } from 'react';
import { Store, UtensilsCrossed, Eye, Clock } from 'lucide-react';
import StatCard from '../../admin/components/StatCard';
import VisitorLineChart from '../../admin/components/VisitorLineChart';
import { useVenuesStore, getVenues, getViewsOverTime } from '../lib/agentData';

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentDashboard() {
  const venuesSnapshot = useVenuesStore();
  const venues = useMemo(() => getVenues(), [venuesSnapshot]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    let active = true;
    getViewsOverTime(14).then((data) => {
      if (active) setChartData(data);
    });
    return () => {
      active = false;
    };
  }, [venuesSnapshot]);

  const totalMenus = venues.reduce((sum, v) => sum + v.menu.length + v.activities.length, 0);
  const totalViews = venues.reduce((sum, v) => sum + (v.viewsCount || 0), 0);

  const recentActivity = useMemo(
    () =>
      [...venues]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((v) => ({ id: v.id, message: `You posted "${v.name}"`, time: v.createdAt })),
    [venues],
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">An overview of the venues you've posted on BallPlan.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Venues" value={venues.length} icon={Store} tone="brand" />
        <StatCard label="Total Menus" value={totalMenus} icon={UtensilsCrossed} tone="amber" />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} tone="sky" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 text-sm font-bold text-ink dark:text-white">Views over the last 14 days</h2>
          <VisitorLineChart data={chartData} />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
            <Clock size={15} className="text-brand" /> Recent activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-xs text-ink/40 dark:text-white/40">Nothing yet — add your first venue.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="border-b border-ink/5 pb-3 text-sm last:border-0 last:pb-0 dark:border-white/5">
                  <p className="text-ink/80 dark:text-white/80">{a.message}</p>
                  <p className="mt-0.5 text-xs text-ink/35 dark:text-white/35">{timeAgo(a.time)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

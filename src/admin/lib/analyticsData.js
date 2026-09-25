// Website visitor analytics for the dashboard — real page views logged by
// the customer app (src/lib/analytics.js), aggregated server-side by the
// get_visitor_series RPC in Lagos time with empty hours/days/months filled
// in as zero. "Visitors" are distinct browsers (a random id kept in the
// visitor's localStorage), so reloading doesn't inflate the number.
import { supabase } from './supabaseClient';

const RANGE_KEY = { Day: 'day', Week: 'week', Month: 'month' };
const TZ = 'Africa/Lagos';

function labelFor(range, iso) {
  const date = new Date(iso);
  if (range === 'Day') return date.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: TZ });
  if (range === 'Week') return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
  return date.toLocaleDateString('en-US', { month: 'short', timeZone: TZ });
}

// -> { points: [{ label, count, views }], totalVisitors, totalViews }
export async function fetchVisitorSeries(range) {
  const { data, error } = await supabase.rpc('get_visitor_series', { p_range: RANGE_KEY[range] });
  if (error) throw new Error(error.message);
  return {
    points: (data.buckets || []).map((b) => ({ label: labelFor(range, b.t), count: b.visitors, views: b.views })),
    totalVisitors: data.total_visitors ?? 0,
    totalViews: data.total_views ?? 0,
  };
}

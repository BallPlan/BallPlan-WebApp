// Ranks agents against each other with a points score (admin Agent
// details, and the leaderboard on every dashboard).
//
// Performance points  = 10 per venue + 1 per menu item/activity
//   Every item counts, so an agent whose venues need long menus
//   (restaurants, lounges) earns for that work, while one adding many
//   small venues (beaches, experiences) still earns for each venue.
//   Items-per-venue alone was rejected: one venue with 50 items would beat
//   ten venues with 40 items each.
// Activity points     = 2 per active day in the last 30 days
//                       + 1 per day of current streak (counted up to 30)
//   Showing up regularly counts, and an unbroken streak counts extra.
// Overall points      = performance + activity.
//
// Most active / Best performing / Overall rank by those three totals.
// Equal points share a rank (1, 2, 2, 4); ties are broken by customer
// views, then items.
import { computeStreak, dayKey, shiftDay } from '../../utils/streak';

export const ACTIVE_WINDOW_DAYS = 30;
export const POINTS = { venue: 10, item: 1, activeDay: 2, streakDay: 1 };

function rankBy(list, compare, field) {
  const sorted = [...list].sort(compare);
  sorted.forEach((a, i) => {
    a[field] = i > 0 && compare(sorted[i - 1], a) === 0 ? sorted[i - 1][field] : i + 1;
  });
}

/**
 * Ranks agents from their raw numbers.
 * @param stats [{ id, name, status, avatarUrl, days: ['YYYY-MM-DD'], venues, items, views }]
 * @returns the agents sorted by overall rank, with activeDays, streak,
 *   activityPoints / performancePoints / points and
 *   activeRank / performanceRank / overallRank attached
 */
export function rankAgentStats(stats) {
  const since = shiftDay(dayKey(), -(ACTIVE_WINDOW_DAYS - 1));
  const list = stats.map((a) => {
    const activeDays = (a.days || []).filter((d) => d >= since).length;
    const streak = computeStreak(a.days || []).current;
    const activityPoints = activeDays * POINTS.activeDay + Math.min(streak, ACTIVE_WINDOW_DAYS) * POINTS.streakDay;
    const performancePoints = a.venues * POINTS.venue + a.items * POINTS.item;
    return { ...a, activeDays, streak, activityPoints, performancePoints, points: activityPoints + performancePoints };
  });

  const tieBreak = (a, b) => b.views - a.views || b.items - a.items;
  rankBy(list, (a, b) => b.activityPoints - a.activityPoints || b.streak - a.streak, 'activeRank');
  rankBy(list, (a, b) => b.performancePoints - a.performancePoints || tieBreak(a, b), 'performanceRank');
  const byOverall = (a, b) => b.points - a.points || tieBreak(a, b);
  rankBy(list, byOverall, 'overallRank');
  return list.sort(byOverall);
}

// What it would take to gain `gap` points, in plain words.
export function pointsToCatchUp(gap) {
  const g = Math.max(1, gap);
  const venues = Math.ceil(g / POINTS.venue);
  const days = Math.ceil(g / (POINTS.activeDay + POINTS.streakDay));
  return { points: g, items: g, venues, days };
}

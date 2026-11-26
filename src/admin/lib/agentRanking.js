// Ranks all agents against each other for the admin Agent details page.
//
//  * Most active: days active (signed in / worked on venues) in the last
//    30 days; ties go to the longer current streak.
//  * Best performing: venues uploaded; ties go to more menu items +
//    activities, then more customer views.
//  * Overall: the two ranks added together (lower is better); ties go to
//    the better performer.
//
// Each rank is "competition" style: equal results share a rank (1, 2, 2, 4).
import { computeStreak, dayKey, shiftDay } from '../../utils/streak';

export const ACTIVE_WINDOW_DAYS = 30;

function rankBy(list, compare, field) {
  const sorted = [...list].sort(compare);
  sorted.forEach((a, i) => {
    a[field] = i > 0 && compare(sorted[i - 1], a) === 0 ? sorted[i - 1][field] : i + 1;
  });
}

/**
 * @param agents   profiles rows (role agent)
 * @param venues   admin venues (with createdBy, menu, activities, viewsCount)
 * @param dayRows  staff_daily_activity rows ({ user_id, day }) for the window
 * @returns agents sorted by overall rank, with stats and ranks attached
 */
export function rankAgents(agents, venues, dayRows) {
  const since = shiftDay(dayKey(), -(ACTIVE_WINDOW_DAYS - 1));
  const daysByAgent = {};
  dayRows.forEach((r) => {
    (daysByAgent[r.user_id] ||= []).push(r.day);
  });

  const list = agents.map((a) => {
    const mine = venues.filter((v) => v.createdBy === a.id);
    const days = daysByAgent[a.id] || [];
    return {
      id: a.id,
      name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email,
      status: a.status,
      activeDays: days.filter((d) => d >= since).length,
      streak: computeStreak(days).current,
      venues: mine.length,
      items: mine.reduce((n, v) => n + v.menu.length + v.activities.length, 0),
      views: mine.reduce((n, v) => n + (Number(v.viewsCount) || 0), 0),
    };
  });

  const byActivity = (a, b) => b.activeDays - a.activeDays || b.streak - a.streak;
  const byPerformance = (a, b) => b.venues - a.venues || b.items - a.items || b.views - a.views;
  rankBy(list, byActivity, 'activeRank');
  rankBy(list, byPerformance, 'performanceRank');
  list.forEach((a) => {
    a.score = a.activeRank + a.performanceRank;
  });
  const byOverall = (a, b) => a.score - b.score || a.performanceRank - b.performanceRank || a.activeRank - b.activeRank;
  rankBy(list, byOverall, 'overallRank');

  return list.sort(byOverall);
}

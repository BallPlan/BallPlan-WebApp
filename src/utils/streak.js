// Agent activity streaks. A "day" is a calendar day in Lagos time, and an
// agent is active on a day if they signed in to their dashboard (or added/
// edited a venue) that day — i.e. a staff_daily_activity row exists.
const TZ = 'Africa/Lagos';

// YYYY-MM-DD for a moment, in Lagos time (matches the database's days).
export const dayKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);

// The day before/after a YYYY-MM-DD key.
export const shiftDay = (key, delta) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

// { current, longest, activeToday, totalDays } from a list of day keys.
// The current streak stays alive through today even before today's
// activity (it counts back from yesterday), and breaks after a missed day.
export function computeStreak(dayKeys) {
  const set = new Set(dayKeys);
  const today = dayKey();
  const activeToday = set.has(today);

  let current = 0;
  for (let k = activeToday ? today : shiftDay(today, -1); set.has(k); k = shiftDay(k, -1)) current += 1;

  let longest = 0;
  let run = 0;
  let prev = null;
  [...set].sort().forEach((k) => {
    run = prev && shiftDay(prev, 1) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  });

  return { current, longest, activeToday, totalDays: set.size };
}

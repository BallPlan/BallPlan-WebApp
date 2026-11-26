// The signed-in agent's own daily activity (staff_daily_activity rows) and
// the "streak" popup trigger. celebrateStreak() is called after sign-in and
// after a venue is added or edited; StreakCelebration (in AgentApp) listens
// and shows the popup with the up-to-date streak.
import { supabase } from './supabaseClient';

export async function fetchMyDays(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('staff_daily_activity')
    .select('day, added, edited, first_seen, last_seen')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(400);
  if (error) throw error;
  return data || [];
}

export const STREAK_EVENT = 'ballplan:agent-streak';

// kind: 'signin' | 'added' | 'edited'; venueName for added/edited.
export function celebrateStreak(kind, venueName) {
  window.dispatchEvent(new CustomEvent(STREAK_EVENT, { detail: { kind, venueName } }));
}

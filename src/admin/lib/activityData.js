// Recent activity for the admin/support dashboards — real rows from
// admin_activity_log, which database triggers write to whenever a venue,
// price, report, user, review, category or notification changes (and the
// staff-management Edge Functions write for account changes), attributed to
// whoever actually did it. Replaces the old localStorage mock.
import { useSyncExternalStore } from 'react';
import { supabase, onSignedIn } from './supabaseClient';

let activity = [];
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function refreshActivity() {
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('id, message, kind, actor_name, actor_role, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('[activityData] fetch failed', error);
    return;
  }
  activity = (data || []).map((a) => ({ id: a.id, message: a.message, kind: a.kind, actorRole: a.actor_role, time: a.created_at }));
  emit();
}

refreshActivity();
onSignedIn(refreshActivity);

// Quiet background refresh so the feed stays current while a dashboard tab
// is left open — only while it's visible, and only once someone's signed in.
if (typeof document !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) refreshActivity();
    });
  }, 45000);
}

export function getActivity() {
  return activity;
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useActivityStore = () => useStoreValue(getActivity);

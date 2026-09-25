// Fire-and-forget usage reporting. Nothing here should ever surface an error
// to the visitor or slow a page down — failures are swallowed.
import { supabase } from './supabaseClient';

// A random id kept in this browser so the admin dashboard can count
// distinct visitors rather than raw page loads. It's not tied to a person
// or an account; clearing site data just makes them a "new" visitor.
function visitorId() {
  try {
    let id = window.localStorage.getItem('ballplan_visitor_id');
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem('ballplan_visitor_id', id);
    }
    return id;
  } catch {
    return null;
  }
}

let lastTracked = { path: null, at: 0 };

// Feeds the admin/support dashboard's "Website visitors" chart. Skipped in
// local development so testing doesn't pollute the real numbers.
export function trackPageView(pathname, userId) {
  if (import.meta.env.DEV) return;
  const path = String(pathname || '/').slice(0, 200);
  const now = Date.now();
  if (lastTracked.path === path && now - lastTracked.at < 1500) return; // StrictMode double-effect / rapid re-render
  lastTracked = { path, at: now };
  supabase
    .from('page_views')
    .insert({ path, user_id: userId ?? null, visitor_id: visitorId() })
    .then(() => {}, () => {});
}

// The plan PDF is generated in the browser, so the server can't know it was
// downloaded — this tells it, so the account gets a "your plan is ready"
// notification. Guests have no account to notify.
export async function reportPlanDownloaded({ venues, items, total }) {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.rpc('notify_plan_downloaded', { p_venues: venues, p_items: items, p_total: Math.round(total) });
  } catch {
    // best-effort
  }
}

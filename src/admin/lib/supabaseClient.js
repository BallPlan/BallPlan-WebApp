import { createClient } from '@supabase/supabase-js';

// Two fully isolated Supabase Auth sessions — one for /admin, one for
// /support — each its own localStorage slot, so signing into one can
// never be read, overwritten or signed out by the other sharing state
// (which is also why the consumer app gets its own key too; see
// src/lib/supabaseClient.js). Every admin/lib/* data module and the few
// pages that talk to Supabase directly (Users.jsx, Waitlist.jsx) import
// the single `supabase` export below, so which session they use depends on
// which portal's page is running.
//
// The choice is made right here, at module-evaluation time, from a flag
// support.html sets in an inline script before any module runs. It has to
// be decided here rather than by a setter called from support's entry file:
// the data modules fetch at import time, and once bundled the shared chunk
// (this file + those modules) is evaluated *before* the support entry's own
// code — so a later "switch to the support session" call would arrive after
// they had already fetched with the admin session.
const portalIsSupport = typeof window !== 'undefined' && window.__ballplanPortal === 'support';

export const adminSession = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'ballplan-admin-auth',
    },
  },
);

export const supportSession = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'ballplan-support-auth',
    },
  },
);

export const supabase = portalIsSupport ? supportSession : adminSession;

// The data modules load once at import — before anyone has signed in on a
// fresh visit, when RLS-gated tables (reports, users, notifications, the
// activity log) come back empty. Re-run their loader whenever a session
// becomes available so a login shows real data without a page reload.
export function onSignedIn(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      // Not called inline: supabase-js can deadlock if you make other
      // supabase calls synchronously inside this callback.
      setTimeout(callback, 0);
    }
  });
}

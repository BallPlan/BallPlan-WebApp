import { createClient } from '@supabase/supabase-js';

// Two fully isolated Supabase Auth sessions — one for /admin, one for
// /support — each its own localStorage slot, so signing into one can
// never be read, overwritten or signed out by the other sharing state
// (which is also why the consumer app gets its own key too; see
// src/lib/supabaseClient.js). Every admin/lib/* data module and the few
// pages that talk to Supabase directly (Users.jsx, Waitlist.jsx) import
// the `supabase` binding below rather than either of these two by name,
// so which session they actually use depends on which bundle is running:
// src/admin/main.jsx leaves it pointed at adminSession (the default);
// src/support/main.jsx calls activateSupportSession() once, before
// AdminApp ever renders, to repoint it at supportSession instead. This
// is a plain mutable export rather than a const — every reference to `supabase`
// below is inside a function body, so it's read fresh at call time
// (a live ES module binding), always after that repoint has happened.
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

export let supabase = adminSession;

// Not a React hook (despite the name pattern that would suggest one) —
// just a plain setter, called once at module-eval time by
// src/support/main.jsx before AdminApp ever renders.
export function activateSupportSession() {
  supabase = supportSession;
}

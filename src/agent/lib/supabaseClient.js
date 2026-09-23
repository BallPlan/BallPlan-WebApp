import { createClient } from '@supabase/supabase-js';

// Own storage key, isolated from both the consumer app's and the admin/
// support app's clients — all three share an origin, and Supabase syncs
// auth state across same-origin tabs, so without this an agent's session
// could collide with (or be killed by) the other apps' auth logic.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'ballplan-agent-auth',
    },
  },
);

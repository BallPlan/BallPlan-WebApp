import { createClient } from '@supabase/supabase-js';

// Separate storage key from the consumer app's client (src/lib/supabaseClient.js).
// Both apps run on the same origin, and Supabase syncs auth state across
// same-origin tabs — without this, signing into /admin could be seen (and
// signed back out) by a consumer-app tab's staff-account rejection logic,
// since they'd otherwise share the same stored session.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'ballplan-admin-auth',
    },
  },
);

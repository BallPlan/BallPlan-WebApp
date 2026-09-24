import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminAuthContext = createContext(null);

async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, status')
    .eq('id', userId)
    .single();
  return data || null;
}

// Backs both /admin and /support — two separate builds/bundles (see
// AdminApp.jsx's swappable LoginPage/allowedRoles props and
// src/support/main.jsx) that both import this same context module, so
// they share one auth *codepath* but NOT one session or one set of
// allowed roles: src/admin/main.jsx passes allowedRoles={['owner']} and
// the default admin supabase client; src/support/main.jsx passes
// allowedRoles={['support']} and switches the shared `supabase` binding
// to its own isolated session first (see lib/supabaseClient.js). Net
// effect: an owner account can't sign into /support, a support account
// can't sign into /admin, and neither portal's session is visible to the
// other even if both happen to be open in the same browser. Agents have
// their own separate portal (AgentAuthContext) and can't log in here.
export function AdminAuthProvider({ children, allowedRoles = ['owner'] }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isStaffProfile = (p) => !!p && allowedRoles.includes(p.role);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setProfile(session?.user ? await loadProfile(session.user.id) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setSession(session);
      setProfile(session?.user ? await loadProfile(session.user.id) : null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Password-based, unlike the customer app's email OTP — matches how
  // Settings > Agents/Support creates staff accounts with an owner-chosen
  // password.
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const staffProfile = await loadProfile(data.user.id);
    if (!isStaffProfile(staffProfile)) {
      await supabase.auth.signOut();
      throw new Error('This account does not have access to this dashboard.');
    }
    if (staffProfile.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('This account has been suspended.');
    }

    setProfile(staffProfile);
    return staffProfile;
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AdminAuthContext.Provider
      value={{
        user: session?.user ? { ...session.user, ...profile } : null,
        loading,
        isStaff: isStaffProfile(profile),
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

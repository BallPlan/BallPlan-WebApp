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
// AdminApp.jsx's swappable LoginPage and src/support/main.jsx) that both
// import this same context module, so they share one auth backend and
// session; the nav and Settings tabs restrict themselves further by role.
// Agents have their own separate portal (AgentAuthContext) and can't log
// in here.
function isStaffProfile(profile) {
  return !!profile && ['owner', 'support'].includes(profile.role);
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
  // Settings > Team creates agent accounts with an owner-chosen password.
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const staffProfile = await loadProfile(data.user.id);
    if (!isStaffProfile(staffProfile)) {
      await supabase.auth.signOut();
      throw new Error('This account does not have admin access.');
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

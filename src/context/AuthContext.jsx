import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

function toDisplayUser(user) {
  if (!user) return null;
  return { ...user, name: user.user_metadata?.name || user.email.split('@')[0] };
}

// Staff (agent/owner) accounts belong to the admin dashboard, not the
// customer app — same auth.users table, but this app should refuse them.
async function isStaffAccount(userId) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return !!data && ['agent', 'owner', 'support'].includes(data.role);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Also enforced here (not just in signIn) so a staff session established
    // before this check existed, or restored from a stale cookie, still
    // gets signed out of the customer app rather than silently working.
    async function applySession(nextUser) {
      if (nextUser && (await isStaffAccount(nextUser.id))) {
        await supabase.auth.signOut();
        if (active) setUser(null);
        return;
      }
      if (active) setUser(nextUser);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null).finally(() => {
        if (active) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Creates the account and triggers a 6-digit confirmation code email.
  // Supabase returns 200 with an empty identities array (rather than an
  // error) when the email is already registered, to avoid leaking which
  // emails exist — this is the documented way to detect that case.
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data?.user?.identities?.length === 0) {
      const err = new Error('An account with this email already exists — sign in instead.');
      err.code = 'user_already_exists';
      throw err;
    }
  };

  // Confirms a new signup with the code from that email — establishes a session.
  const verifySignup = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (await isStaffAccount(data.user.id)) {
      await supabase.auth.signOut();
      const err = new Error('This is a staff account — sign in at the admin dashboard instead.');
      err.code = 'staff_account';
      throw err;
    }

    setUser(data.user);
    return data.user;
  };

  // Sends a 6-digit password-reset code. Supabase returns success even for
  // an email with no account, so this never reveals whether one exists.
  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // Confirms the reset code — establishes a session just for changing the password.
  const verifyRecovery = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        user: toDisplayUser(user),
        loading,
        signUp,
        verifySignup,
        signIn,
        requestPasswordReset,
        verifyRecovery,
        updatePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

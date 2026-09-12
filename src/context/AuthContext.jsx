import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

function toDisplayUser(user) {
  if (!user) return null;
  return { ...user, name: user.user_metadata?.name || user.email.split('@')[0] };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sends a 6-digit email code. allowSignup=false for sign-in (won't
  // silently create an account for an email that isn't registered yet),
  // true for sign-up.
  const sendCode = async (email, allowSignup) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: allowSignup },
    });
    if (error) throw error;
  };

  const verifyCode = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  };

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user: toDisplayUser(user), loading, sendCode, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

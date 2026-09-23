import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AgentAuthContext = createContext(null);

async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, name, role, status')
    .eq('id', userId)
    .single();
  return data || null;
}

function isAgentProfile(profile) {
  return !!profile && profile.role === 'agent';
}

export function AgentAuthProvider({ children }) {
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

  // Password-based, same as admin/support — agent accounts are created by
  // an owner or support account, never self-registered.
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const agentProfile = await loadProfile(data.user.id);
    if (!isAgentProfile(agentProfile)) {
      await supabase.auth.signOut();
      throw new Error('This account does not have agent access.');
    }
    if (agentProfile.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('This account has been suspended.');
    }

    setProfile(agentProfile);
    return agentProfile;
  };

  const signOut = () => supabase.auth.signOut();

  const updateOwnProfile = async (patch) => {
    if (!session?.user) throw new Error('Not signed in');
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, ...patch }));
  };

  return (
    <AgentAuthContext.Provider
      value={{
        user: session?.user ? { ...session.user, ...profile } : null,
        loading,
        isAgent: isAgentProfile(profile),
        signIn,
        signOut,
        updateOwnProfile,
      }}
    >
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const ctx = useContext(AgentAuthContext);
  if (!ctx) throw new Error('useAgentAuth must be used within AgentAuthProvider');
  return ctx;
}

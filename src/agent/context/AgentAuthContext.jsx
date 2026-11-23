import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { squareAvatarBlob } from '../../utils/resizeImage';

const AgentAuthContext = createContext(null);

async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, name, role, status, avatar_url')
    .eq('id', userId)
    .single();
  return data || null;
}

function isAgentProfile(profile) {
  return !!profile && profile.role === 'agent';
}

const isSuspendedAgent = (profile) => isAgentProfile(profile) && profile.status === 'suspended';

// How often to re-check the agent's status in case the live (realtime)
// connection drops; the realtime update normally arrives within a second.
const STATUS_POLL_MS = 30_000;

export function AgentAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True once we've signed someone out because admin/support deactivated
  // their account; drives the "account deactivated" popup.
  const [deactivated, setDeactivated] = useState(false);

  const kickOut = useCallback(async () => {
    setDeactivated(true);
    setProfile(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = async (session) => {
      const p = session?.user ? await loadProfile(session.user.id) : null;
      if (!active) return;
      if (isSuspendedAgent(p)) {
        await kickOut();
        return;
      }
      setSession(session);
      setProfile(p);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session);
      if (active) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Deferred: awaiting Supabase calls inside this callback can deadlock
      // the auth client.
      setTimeout(() => applySession(session), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [kickOut]);

  // While an agent is signed in, watch their own profile row: deactivation
  // (or losing the agent role) signs them out straight away. Realtime is
  // the instant path; the poll and the tab-focus check are the safety net.
  const userId = session?.user?.id;
  const signedInAsAgent = isAgentProfile(profile);
  useEffect(() => {
    if (!userId || !signedInAsAgent) return undefined;
    let stopped = false;

    const check = (p) => {
      if (stopped || !p) return;
      if (p.status === 'suspended' || p.role !== 'agent') {
        stopped = true;
        kickOut();
      }
    };
    const recheck = async () => check(await loadProfile(userId));

    const channel = supabase
      .channel(`agent-status-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) =>
        check(payload.new),
      )
      .subscribe();
    const timer = setInterval(recheck, STATUS_POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && recheck();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', recheck);

    return () => {
      stopped = true;
      supabase.removeChannel(channel);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', recheck);
    };
  }, [userId, signedInAsAgent, kickOut]);

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
      await kickOut();
      const err = new Error('This account has been deactivated. Please contact admin.');
      err.deactivated = true;
      throw err;
    }

    setDeactivated(false);
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

  // Profile picture: cropped/scaled to a small square JPEG in the browser,
  // stored at avatars/<user id>/avatar.jpg (the bucket's policies only let
  // you write inside your own folder), and its public URL saved on the
  // profile. The ?v= suffix busts the cache when the picture is replaced.
  const uploadAvatar = async (file) => {
    if (!session?.user) throw new Error('Not signed in');
    const blob = await squareAvatarBlob(file);
    const path = `${session.user.id}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await updateOwnProfile({ avatar_url: url });
    return url;
  };

  const removeAvatar = async () => {
    if (!session?.user) throw new Error('Not signed in');
    await updateOwnProfile({ avatar_url: null });
    await supabase.storage.from('avatars').remove([`${session.user.id}/avatar.jpg`]);
  };

  return (
    <AgentAuthContext.Provider
      value={{
        user: session?.user ? { ...session.user, ...profile } : null,
        loading,
        isAgent: isAgentProfile(profile),
        deactivated,
        dismissDeactivated: () => setDeactivated(false),
        signIn,
        signOut,
        updateOwnProfile,
        uploadAvatar,
        removeAvatar,
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

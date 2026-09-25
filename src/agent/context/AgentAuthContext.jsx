import { createContext, useContext, useEffect, useState } from 'react';
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

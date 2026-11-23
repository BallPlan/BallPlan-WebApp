import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { squareAvatarBlob } from '../../utils/resizeImage';

const AdminAuthContext = createContext(null);

// How often to re-check the signed-in account's status in case the live
// (realtime) connection drops; the realtime update normally arrives within
// a second.
const STATUS_POLL_MS = 30_000;

async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, name, role, status, avatar_url')
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

  // True once we've signed someone out because their account was
  // deactivated; drives the "account deactivated" popup.
  const [deactivated, setDeactivated] = useState(false);

  const isStaffProfile = (p) => !!p && allowedRoles.includes(p.role);
  const rolesKey = allowedRoles.join(',');

  const kickOut = useCallback(async () => {
    setDeactivated(true);
    setProfile(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let active = true;
    const roles = rolesKey.split(',');

    const applySession = async (session) => {
      const p = session?.user ? await loadProfile(session.user.id) : null;
      if (!active) return;
      if (p && roles.includes(p.role) && p.status === 'suspended') {
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
  }, [kickOut, rolesKey]);

  // While signed in, watch the account's own profile row: deactivation (or
  // a role change that removes access to this portal) signs them out
  // straight away. Realtime is the instant path; the poll and the tab-focus
  // check are the safety net.
  const userId = session?.user?.id;
  const signedInHere = isStaffProfile(profile);
  useEffect(() => {
    if (!userId || !signedInHere) return undefined;
    let stopped = false;
    const roles = rolesKey.split(',');

    const check = (p) => {
      if (stopped || !p) return;
      if (p.status === 'suspended') {
        stopped = true;
        kickOut();
      } else if (!roles.includes(p.role)) {
        stopped = true;
        supabase.auth.signOut();
      }
    };
    const recheck = async () => check(await loadProfile(userId));

    const channel = supabase
      .channel(`staff-status-${userId}`)
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
  }, [userId, signedInHere, rolesKey, kickOut]);

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
      await kickOut();
      const err = new Error('This account has been deactivated. Please contact admin.');
      err.deactivated = true;
      throw err;
    }

    setDeactivated(false);
    setProfile(staffProfile);
    return staffProfile;
  };

  const signOut = () => supabase.auth.signOut();

  const updateOwnProfile = async (patch) => {
    if (!session?.user) throw new Error('Not signed in');
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, ...patch }));
  };

  // Same profile-picture flow as the agent portal (AgentAuthContext): a
  // small square JPEG at avatars/<user id>/avatar.jpg, ?v= busts the cache.
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
    <AdminAuthContext.Provider
      value={{
        user: session?.user ? { ...session.user, ...profile } : null,
        loading,
        isStaff: isStaffProfile(profile),
        deactivated,
        dismissDeactivated: () => setDeactivated(false),
        portalRole: allowedRoles.includes('support') ? 'support' : 'admin',
        signIn,
        signOut,
        updateOwnProfile,
        uploadAvatar,
        removeAvatar,
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

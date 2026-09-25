// Notifications data layer for the admin/support dashboards — real Supabase
// data. Sending goes through the push_notification RPC, which fans one row
// out per recipient and also records a notification_campaigns row; the
// "Sent history" list reads those campaign rows (staff can't read other
// people's notification rows themselves — RLS only lets a user see their
// own — and one campaign row is what "who did I send this to" really is).
import { useSyncExternalStore } from 'react';
import { supabase, onSignedIn } from './supabaseClient';

let campaigns = [];
let users = [];
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function senderName(profile) {
  if (!profile) return null;
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.name || profile.email?.split('@')[0] || null;
}

async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notification_campaigns')
    .select('id, title, body, target_label, recipient_count, created_at, sender:profiles!sent_by(first_name, last_name, name, email)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[notificationsData] fetch failed', error);
    return;
  }
  campaigns = (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    body: c.body,
    target: c.target_label,
    count: c.recipient_count,
    created_at: c.created_at,
    sentBy: senderName(c.sender),
  }));
  emit();
}

async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'customer')
    .eq('status', 'active')
    .order('email');
  if (error) {
    console.error('[notificationsData] users fetch failed', error);
    return;
  }
  users = data || [];
  emit();
}

function refresh() {
  fetchNotifications();
  fetchUsers();
}

refresh();
onSignedIn(refresh);

export function getNotifications() {
  return campaigns;
}
export function getUsers() {
  return users;
}

// target: 'all' or a customer's email address. Throws an Error whose
// message is the server's reason (e.g. "No customer with the email …").
export async function pushNotification({ title, body, target }) {
  const { data, error } = await supabase.rpc('push_notification', {
    p_title: title,
    p_body: body,
    p_target_email: target === 'all' ? null : target,
  });
  if (error) throw new Error(error.message);
  await fetchNotifications();
  return data; // number of recipients
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useNotificationsStore = () => useStoreValue(getNotifications);
export const useUsersStore = () => useStoreValue(getUsers);

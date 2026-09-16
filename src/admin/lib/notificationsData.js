// Notifications data layer for the admin dashboard — real Supabase data.
// The notifications table stores one row per recipient (fanned out by the
// push_notification RPC), so there's no separate "campaign" record. Sent
// history is reconstructed by grouping rows with the same title/body/
// created_at — since a single push runs inside one INSERT statement, every
// row it creates shares the exact same transaction timestamp.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabaseClient';

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

async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    console.error('[notificationsData] fetch failed', error);
    return;
  }
  const map = new Map();
  (data || []).forEach((n) => {
    const key = `${n.title}|||${n.body}|||${n.created_at}`;
    if (!map.has(key)) map.set(key, { id: key, title: n.title, body: n.body, created_at: n.created_at, count: 0 });
    map.get(key).count += 1;
  });
  campaigns = Array.from(map.values());
  emit();
}

async function fetchUsers() {
  const { data, error } = await supabase.from('profiles').select('id, email').eq('role', 'customer').order('email');
  if (error) {
    console.error('[notificationsData] users fetch failed', error);
    return;
  }
  users = data || [];
  emit();
}

fetchNotifications();
fetchUsers();

export function getNotifications() {
  return campaigns;
}
export function getUsers() {
  return users;
}

export async function pushNotification({ title, body, target }) {
  const { error } = await supabase.rpc('push_notification', {
    p_title: title,
    p_body: body,
    p_target: target === 'all' ? null : target,
  });
  if (error) throw error;
  await fetchNotifications();
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useNotificationsStore = () => useStoreValue(getNotifications);
export const useUsersStore = () => useStoreValue(getUsers);

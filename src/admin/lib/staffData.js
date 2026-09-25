// Real agent/support staff account management for the admin Settings page.
// Creating, resetting, and deleting accounts needs the service role key, so
// those go through Edge Functions; suspending/reinstating is a plain RLS-
// gated profile update any staff member can already do.
import { useSyncExternalStore } from 'react';
import { supabase, onSignedIn } from './supabaseClient';

let staff = [];
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function fetchAll() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, status, created_at')
    .in('role', ['agent', 'support'])
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[staffData] fetch failed', error);
    return;
  }
  staff = data || [];
  emit();
}

fetchAll();
onSignedIn(fetchAll);

export function getStaff() {
  return staff;
}
export function getAgents() {
  return staff.filter((s) => s.role === 'agent');
}
export function getSupportStaff() {
  return staff.filter((s) => s.role === 'support');
}

async function callFn(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createStaffAccount({ role, email, password, firstName, lastName }) {
  const data = await callFn('create-staff-account', { role, email, password, firstName, lastName });
  await fetchAll();
  return data;
}

export async function resetStaffPassword(userId) {
  return callFn('reset-staff-password', { user_id: userId });
}

export async function deleteStaffAccount(userId) {
  await callFn('delete-staff-account', { user_id: userId });
  await fetchAll();
}

export async function toggleStaffStatus(userId, status) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
  if (error) throw error;
  await fetchAll();
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useStaffStore = () => useStoreValue(getStaff);

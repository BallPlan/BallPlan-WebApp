// Price-report data layer for the admin dashboard — replaces the localStorage
// mock in shared/store.js with real Supabase queries against price_reports.
// Denormalized display fields (item name/image, venue name) aren't stored on
// the row itself, so they're resolved by looking the venue/item up in the
// venues data layer, which is already fetched for the Venues pages.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabaseClient';

let reports = [];
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function fetchAll() {
  const { data, error } = await supabase.from('price_reports').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[reportsData] fetch failed', error);
    return;
  }
  reports = data || [];
  emit();
}

fetchAll();

export function getReports() {
  return reports;
}

export async function resolveReport(id) {
  const { error } = await supabase.rpc('resolve_price_report', { p_report_id: id });
  if (error) throw error;
  await fetchAll();
}

export async function dismissReport(id) {
  const { error } = await supabase.from('price_reports').update({ status: 'dismissed' }).eq('id', id);
  if (error) throw error;
  await fetchAll();
}

export async function deleteReport(id) {
  const { error } = await supabase.from('price_reports').delete().eq('id', id);
  if (error) throw error;
  await fetchAll();
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useReportsStore = () => useStoreValue(getReports);

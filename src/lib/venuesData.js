// Read-only venues/categories data layer backed by Supabase, replacing the
// old localStorage mock in shared/store.js. Exposes the same function names
// and camelCase venue shape (fromPrice, openTime, menu, activities, ...) the
// consumer pages already use, so only import paths needed to change there —
// not every field reference across Home/Search/Details/PlanResult/etc.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabaseClient';

let venues = [];
let categories = [];
let loaded = false;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function toFormItem(i) {
  return { id: i.id, name: i.name, image: i.image, price: i.price, desc: i.description };
}

function normalizeVenue(v, itemsByVenue) {
  const items = itemsByVenue[v.id] || [];
  return {
    ...v,
    fromPrice: v.from_price,
    openTime: v.open_time,
    closeTime: v.close_time,
    hasVideo: v.has_video,
    hasMenu: v.has_menu,
    hasActivities: v.has_activities,
    hiddenFees: v.hidden_fees || [],
    menu: items.filter((i) => i.kind === 'menu').map(toFormItem),
    activities: items.filter((i) => i.kind === 'activity').map(toFormItem),
  };
}

async function fetchAll() {
  const [{ data: cats, error: catErr }, { data: vs, error: vErr }, { data: items, error: iErr }] = await Promise.all([
    supabase.from('categories').select('*').eq('status', 'active').order('name'),
    supabase.from('venues').select('*').eq('published', true).order('created_at', { ascending: false }),
    supabase.from('venue_items').select('*').order('sort_order'),
  ]);
  if (catErr || vErr || iErr) {
    console.error('[venuesData] fetch failed', catErr || vErr || iErr);
    return;
  }
  const itemsByVenue = {};
  (items || []).forEach((i) => {
    (itemsByVenue[i.venue_id] ||= []).push(i);
  });
  venues = (vs || []).map((v) => normalizeVenue(v, itemsByVenue));
  categories = cats || [];
  loaded = true;
  emit();
}

fetchAll();

export function getVenues() {
  return venues;
}
export function getPublishedVenues() {
  return venues;
}
export function getVenueById(id) {
  return venues.find((v) => v.id === id);
}
export function getCategories() {
  return categories;
}
export function getActiveCategoryNames() {
  return ['All', ...categories.map((c) => c.name)];
}
export function isVenuesLoaded() {
  return loaded;
}
export function filterVenues({ tab = 'All', query = '', location = '', maxBudget = null } = {}) {
  return venues.filter((v) => {
    if (tab !== 'All' && v.tab !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${v.name} ${v.category} ${v.location} ${v.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (location && !v.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (maxBudget && v.fromPrice > maxBudget) return false;
    return true;
  });
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useVenuesStore = () => useStoreValue(getVenues);
export const useCategoriesStore = () => useStoreValue(getCategories);

// Venues/categories data layer for the admin dashboard — full CRUD against
// Supabase, replacing the localStorage mock in shared/store.js. Exposes the
// same function names and camelCase venue shape (fromPrice, openTime, menu,
// activities, ...) the admin pages already use, so only import paths needed
// to change there. Uses the admin app's own isolated Supabase client so
// writes are authenticated as the signed-in staff session.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabaseClient';

let venues = [];
let categories = [];
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
    supabase.from('categories').select('*').order('name'),
    supabase.from('venues').select('*').order('created_at', { ascending: false }),
    supabase.from('venue_items').select('*').order('sort_order'),
  ]);
  if (catErr || vErr || iErr) {
    console.error('[admin venuesData] fetch failed', catErr || vErr || iErr);
    return;
  }
  const itemsByVenue = {};
  (items || []).forEach((i) => {
    (itemsByVenue[i.venue_id] ||= []).push(i);
  });
  venues = (vs || []).map((v) => normalizeVenue(v, itemsByVenue));
  categories = cats || [];
  emit();
}

fetchAll();

export function getVenues() {
  return venues;
}
export function getVenueById(id) {
  return venues.find((v) => v.id === id);
}
export function getCategories() {
  return categories;
}
export function getActiveCategoryNames() {
  return ['All', ...categories.filter((c) => c.status === 'active').map((c) => c.name)];
}
export function venueCountForCategory(name) {
  return venues.filter((v) => v.tab === name).length;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function venueColumns(venue) {
  return {
    name: venue.name,
    category: venue.category,
    tab: venue.tab,
    location: venue.location,
    address: venue.address || null,
    phone: venue.phone || null,
    rating: Number(venue.rating) || 0,
    open_time: venue.openTime || null,
    close_time: venue.closeTime || null,
    description: venue.description || null,
    from_price: Number(venue.fromPrice) || 0,
    hero: venue.hero || null,
    gallery: venue.gallery || [],
    has_video: !!venue.hasVideo,
    has_menu: !!venue.hasMenu,
    has_activities: !!venue.hasActivities,
    hidden_fees: venue.hiddenFees || [],
    published: venue.published ?? true,
  };
}

async function replaceVenueItems(venueId, venue) {
  const { error: delErr } = await supabase.from('venue_items').delete().eq('venue_id', venueId);
  if (delErr) throw delErr;

  const rows = [
    ...(venue.menu || []).map((m, idx) => ({
      id: `m${idx + 1}`,
      venue_id: venueId,
      kind: 'menu',
      name: m.name,
      image: m.image || null,
      price: Number(m.price) || 0,
      description: m.desc || null,
      sort_order: idx,
    })),
    ...(venue.activities || []).map((a, idx) => ({
      id: `a${idx + 1}`,
      venue_id: venueId,
      kind: 'activity',
      name: a.name,
      image: a.image || null,
      price: Number(a.price) || 0,
      description: a.desc || null,
      sort_order: idx,
    })),
  ].filter((r) => r.name);

  if (rows.length) {
    const { error } = await supabase.from('venue_items').insert(rows);
    if (error) throw error;
  }
}

export async function addVenue(venue) {
  const id = venue.id?.trim() || `${slugify(venue.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('venues').insert({ id, ...venueColumns(venue) });
  if (error) throw error;
  await replaceVenueItems(id, venue);
  await fetchAll();
  return id;
}

export async function updateVenue(id, venue) {
  const { error } = await supabase.from('venues').update(venueColumns(venue)).eq('id', id);
  if (error) throw error;
  await replaceVenueItems(id, venue);
  await fetchAll();
}

export async function deleteVenue(id) {
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) throw error;
  await fetchAll();
}

export async function setVenuePublished(id, published) {
  const { error } = await supabase.from('venues').update({ published }).eq('id', id);
  if (error) throw error;
  await fetchAll();
}

export async function addCategory({ name, singular }) {
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
  const { error } = await supabase.from('categories').insert({ id, name, singular: singular || name, status: 'active' });
  if (error) throw error;
  await fetchAll();
}

export async function updateCategory(id, patch) {
  const existing = categories.find((c) => c.id === id);
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw error;
  if (existing && patch.name && patch.name !== existing.name) {
    await supabase
      .from('venues')
      .update({ tab: patch.name, category: patch.singular || existing.singular })
      .eq('tab', existing.name);
  }
  await fetchAll();
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  await fetchAll();
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useVenuesStore = () => useStoreValue(getVenues);
export const useCategoriesStore = () => useStoreValue(getCategories);

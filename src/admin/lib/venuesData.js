// Venues/categories data layer for the admin dashboard — full CRUD against
// Supabase, replacing the localStorage mock in shared/store.js. Exposes the
// same function names and camelCase venue shape (fromPrice, openTime, menu,
// activities, ...) the admin pages already use, so only import paths needed
// to change there. Uses the admin app's own isolated Supabase client so
// writes are authenticated as the signed-in staff session.
import { useSyncExternalStore } from 'react';
import { supabase, onSignedIn } from './supabaseClient';

const ROLE_LABELS = { owner: 'Admin', support: 'Support', agent: 'Agent', customer: 'User' };

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
  return { id: i.id, name: i.name, image: i.image, price: i.price, desc: i.description, cartAddCount: i.cart_add_count };
}

// Who listed the venue — admin, support or an agent. Venues seeded by the
// BallPlan team before ownership was tracked have no poster.
function toPostedBy(profile) {
  if (!profile) return null;
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    profile.name?.trim() ||
    profile.email?.split('@')[0] ||
    'Unknown';
  return { id: profile.id, name, role: profile.role, roleLabel: ROLE_LABELS[profile.role] || 'User', avatarUrl: profile.avatar_url || null };
}

function normalizeVenue(v, itemsByVenue, postersById = {}) {
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
    viewsCount: v.views_count,
    createdBy: v.created_by,
    postedBy: v.created_by ? toPostedBy(postersById[v.created_by]) || { id: v.created_by, name: 'Deleted account', role: null, roleLabel: '', avatarUrl: null } : null,
    createdAt: v.created_at,
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

  // Staff can read every profile (RLS), so resolve the posters' names in one
  // extra query rather than per venue.
  const posterIds = Array.from(new Set((vs || []).map((v) => v.created_by).filter(Boolean)));
  const postersById = {};
  if (posterIds.length) {
    const { data: posters, error: pErr } = await supabase
      .from('profiles')
      .select('id, email, name, first_name, last_name, role, avatar_url')
      .in('id', posterIds);
    if (pErr) console.error('[admin venuesData] posters fetch failed', pErr);
    (posters || []).forEach((p) => {
      postersById[p.id] = p;
    });
  }

  venues = (vs || []).map((v) => normalizeVenue(v, itemsByVenue, postersById));
  categories = cats || [];
  emit();
}

fetchAll();
onSignedIn(fetchAll);

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

// from_price must always be the venue's actual cheapest item, not a
// separately-typed guess — otherwise it silently drifts from reality the
// moment someone edits the menu/activities without also updating this
// field by hand. Derived here so it can never go stale.
function minItemPrice(venue) {
  const prices = [...(venue.menu || []), ...(venue.activities || [])]
    .map((i) => Number(i.price) || 0)
    .filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : Number(venue.fromPrice) || 0;
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
    from_price: minItemPrice(venue),
    hero: venue.hero || null,
    gallery: venue.gallery || [],
    has_video: !!venue.hasVideo,
    has_menu: !!venue.hasMenu,
    has_activities: !!venue.hasActivities,
    hidden_fees: venue.hiddenFees || [],
    published: venue.published ?? true,
  };
}

// Syncs a venue's menu/activities to what the form holds, by item id —
// updating rows that still exist, inserting new ones, deleting removed
// ones. It used to delete *every* item and re-insert them with ids
// regenerated by position, which on every single edit reset each item's
// "added to cart" count, cascade-deleted its price_history, and would have
// made price-drop alerts impossible (a re-insert is never a price update).
async function syncVenueItems(venueId, venue) {
  const { data: existing, error: exErr } = await supabase.from('venue_items').select('id').eq('venue_id', venueId);
  if (exErr) throw exErr;
  const inDb = new Set((existing || []).map((r) => r.id));
  const used = new Set();

  // New items come from the form with a temporary "new-…" id. Give them a
  // fresh m<n>/a<n> id that has never existed on this venue, so they can't
  // inherit a deleted item's counters.
  const nextId = (prefix) => {
    let n = 1;
    while (inDb.has(`${prefix}${n}`) || used.has(`${prefix}${n}`)) n += 1;
    return `${prefix}${n}`;
  };
  const resolveId = (item, prefix) => {
    const id = item.id && inDb.has(item.id) && !used.has(item.id) ? item.id : nextId(prefix);
    used.add(id);
    return id;
  };

  const rows = [
    ...(venue.menu || [])
      .filter((m) => m.name)
      .map((m, idx) => ({
        id: resolveId(m, 'm'),
        venue_id: venueId,
        kind: 'menu',
        name: m.name,
        image: m.image || null,
        price: Number(m.price) || 0,
        description: m.desc || null,
        sort_order: idx,
      })),
    ...(venue.activities || [])
      .filter((a) => a.name)
      .map((a, idx) => ({
        id: resolveId(a, 'a'),
        venue_id: venueId,
        kind: 'activity',
        name: a.name,
        image: a.image || null,
        price: Number(a.price) || 0,
        description: a.desc || null,
        sort_order: idx,
      })),
  ];

  if (rows.length) {
    const { error } = await supabase.from('venue_items').upsert(rows, { onConflict: 'venue_id,id' });
    if (error) throw error;
  }

  const removed = (existing || []).map((r) => r.id).filter((id) => !used.has(id));
  if (removed.length) {
    const { error } = await supabase.from('venue_items').delete().eq('venue_id', venueId).in('id', removed);
    if (error) throw error;
  }
}

export async function addVenue(venue) {
  const id = venue.id?.trim() || `${slugify(venue.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('venues').insert({ id, ...venueColumns(venue) });
  if (error) throw error;
  await syncVenueItems(id, venue);
  await fetchAll();
  return id;
}

export async function updateVenue(id, venue) {
  const { error } = await supabase.from('venues').update(venueColumns(venue)).eq('id', id);
  if (error) throw error;
  await syncVenueItems(id, venue);
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

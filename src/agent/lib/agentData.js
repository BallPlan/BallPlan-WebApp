// Venues data layer for the agent dashboard — every query is explicitly
// scoped to this agent's own venues (created_by = their user id). RLS also
// enforces this as a ceiling, but on its own would let a plain `select *`
// return every *published* venue regardless of owner (per the public
// "published venues are readable" policy) — so the created_by filter here
// is what actually keeps "my venues" meaning just that.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabaseClient';

let venues = [];
let currentAgentId = null;
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
    viewsCount: v.views_count,
    createdAt: v.created_at,
    menu: items.filter((i) => i.kind === 'menu').map(toFormItem),
    activities: items.filter((i) => i.kind === 'activity').map(toFormItem),
  };
}

export function setCurrentAgentId(id) {
  if (id === currentAgentId) return;
  currentAgentId = id;
  if (id) {
    fetchAll();
  } else {
    venues = [];
    emit();
  }
}

async function fetchAll() {
  if (!currentAgentId) return;
  const { data: vs, error: vErr } = await supabase
    .from('venues')
    .select('*')
    .eq('created_by', currentAgentId)
    .order('created_at', { ascending: false });
  if (vErr) {
    console.error('[agentData] fetch venues failed', vErr);
    return;
  }
  const venueIds = (vs || []).map((v) => v.id);
  let items = [];
  if (venueIds.length) {
    const { data: itemsData, error: iErr } = await supabase
      .from('venue_items')
      .select('*')
      .in('venue_id', venueIds)
      .order('sort_order');
    if (iErr) console.error('[agentData] fetch items failed', iErr);
    items = itemsData || [];
  }
  const itemsByVenue = {};
  items.forEach((i) => {
    (itemsByVenue[i.venue_id] ||= []).push(i);
  });
  venues = (vs || []).map((v) => normalizeVenue(v, itemsByVenue));
  emit();
}

export function getVenues() {
  return venues;
}
export function getVenueById(id) {
  return venues.find((v) => v.id === id);
}

function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}
export const useVenuesStore = () => useStoreValue(getVenues);

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*').eq('status', 'active').order('name');
  if (error) {
    console.error('[agentData] fetch categories failed', error);
    return [];
  }
  return data || [];
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Same rule as admin: from_price is always the cheapest item, never
// hand-typed, so it can't drift from what's actually on the menu.
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

// Syncs the venue's menu/activities by item id (update kept rows, insert new
// ones, delete removed ones) — same rule as the admin data layer. Deleting
// and re-inserting everything on every edit used to reset each item's
// "added to cart" count and cascade-delete its price history.
async function syncVenueItems(venueId, venue) {
  const { data: existing, error: exErr } = await supabase.from('venue_items').select('id').eq('venue_id', venueId);
  if (exErr) throw exErr;
  const inDb = new Set((existing || []).map((r) => r.id));
  const used = new Set();

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
  if (!currentAgentId) throw new Error('Not signed in');
  const id = `${slugify(venue.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('venues').insert({ id, created_by: currentAgentId, ...venueColumns(venue) });
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

// Daily view counts across all of this agent's venues, for the dashboard
// chart — oldest to newest, always `days` points even where the count is 0.
export async function getViewsOverTime(days = 14) {
  const venueIds = venues.map((v) => v.id);
  if (!venueIds.length) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 };
    });
  }
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from('venue_views')
    .select('viewed_at')
    .in('venue_id', venueIds)
    .gte('viewed_at', since);
  if (error) console.error('[agentData] fetch views failed', error);

  const byDay = {};
  (data || []).forEach((r) => {
    const day = r.viewed_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: byDay[key] || 0 };
  });
}

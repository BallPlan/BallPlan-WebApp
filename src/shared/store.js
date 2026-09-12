// The single source of truth for BallPlan's client-side "backend" — plain
// localStorage-backed functions (not React Context) so the exact same module
// can be imported from both the consumer app (index.html) and the admin app
// (admin.html), which are separate bundles and can't share a Context tree.
//
// A tiny in-memory cache + pub/sub layer gives components stable snapshot
// references (safe for useSyncExternalStore) and reactive re-renders on
// writes. A native `storage` event listener also invalidates the cache when
// the OTHER page/tab writes to localStorage, so if an admin approves a price
// correction while the storefront is open in another tab, it updates live.
import { useSyncExternalStore } from 'react';
import {
  buildDefaultVenues,
  buildDefaultCategories,
  buildDefaultNotifications,
  buildDefaultUsers,
  buildDefaultReports,
  buildDefaultActivity,
  buildVisitorStats,
  seedPriceOverridesFromReports,
  slugify,
} from './seed';

export const KEYS = {
  venues: 'ballplan_venues',
  categories: 'ballplan_categories',
  users: 'ballplan_users',
  reports: 'ballplan_reports',
  notifications: 'ballplan_notifications',
  priceOverrides: 'ballplan_price_overrides',
  hiddenReviews: 'ballplan_hidden_reviews',
  activity: 'ballplan_admin_activity',
  visitorStats: 'ballplan_visitor_stats',
  adminTheme: 'ballplan_admin_theme',
  agents: 'ballplan_agents',
  adminProfile: 'ballplan_admin_profile',
  adminPassword: 'ballplan_admin_password',
};

// ---------------------------------------------------------------- low level
const cache = new Map();
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  let value = fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) value = JSON.parse(raw);
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

function writeRaw(key, value) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — in-memory cache still updates for this session
  }
  emit();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) cache.delete(e.key);
    emit();
  });
}

function ensureSeeded(key, builder) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(key) == null) {
    writeRaw(key, builder());
  }
}

ensureSeeded(KEYS.categories, buildDefaultCategories);
ensureSeeded(KEYS.venues, buildDefaultVenues);
ensureSeeded(KEYS.notifications, buildDefaultNotifications);
ensureSeeded(KEYS.users, buildDefaultUsers);
ensureSeeded(KEYS.reports, buildDefaultReports);
ensureSeeded(KEYS.priceOverrides, () => seedPriceOverridesFromReports(readRaw(KEYS.reports, [])));
ensureSeeded(KEYS.hiddenReviews, () => []);
ensureSeeded(KEYS.activity, buildDefaultActivity);
ensureSeeded(KEYS.visitorStats, buildVisitorStats);
ensureSeeded(KEYS.agents, () => []);
ensureSeeded(KEYS.adminProfile, () => ({
  firstName: 'Admin',
  lastName: 'User',
  email: 'demo@admin.com',
  role: 'Owner',
  photo: null,
}));
ensureSeeded(KEYS.adminPassword, () => 'admin123');

// -------------------------------------------------------------- activity log
function logActivity(message) {
  const list = readRaw(KEYS.activity, []);
  const entry = { id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, time: new Date().toISOString() };
  writeRaw(KEYS.activity, [entry, ...list].slice(0, 60));
}
export function getActivity() {
  return readRaw(KEYS.activity, []);
}

// -------------------------------------------------------------------venues
export function getVenues() {
  return readRaw(KEYS.venues, []);
}
export function getVenueById(id) {
  return getVenues().find((v) => v.id === id);
}
export function getPublishedVenues() {
  return getVenues().filter((v) => v.published !== false);
}
export function filterVenues({ tab = 'All', query = '', location = '', maxBudget = null, onlyPublished = true } = {}) {
  const source = onlyPublished ? getPublishedVenues() : getVenues();
  return source.filter((v) => {
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
export function addVenue(venue) {
  const id = venue.id?.trim() || `${slugify(venue.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const newVenue = {
    menu: [],
    activities: [],
    gallery: [],
    hiddenFees: [],
    ...venue,
    id,
    published: venue.published ?? true,
  };
  writeRaw(KEYS.venues, [newVenue, ...getVenues()]);
  logActivity(`New venue added: ${newVenue.name}`);
  return newVenue;
}
export function updateVenue(id, patch) {
  writeRaw(KEYS.venues, getVenues().map((v) => (v.id === id ? { ...v, ...patch } : v)));
  logActivity(`Venue updated: ${patch.name || id}`);
}
export function deleteVenue(id) {
  const v = getVenueById(id);
  writeRaw(KEYS.venues, getVenues().filter((x) => x.id !== id));
  if (v) logActivity(`Venue deleted: ${v.name}`);
}
export function setVenuePublished(id, published) {
  const v = getVenueById(id);
  writeRaw(KEYS.venues, getVenues().map((x) => (x.id === id ? { ...x, published } : x)));
  if (v) logActivity(`${v.name} ${published ? 'published' : 'unpublished'}`);
}

// --------------------------------------------------------------categories
export function getCategories() {
  return readRaw(KEYS.categories, []);
}
export function getActiveCategoryNames() {
  return ['All', ...getCategories().filter((c) => c.status === 'active').map((c) => c.name)];
}
export function addCategory({ name, singular }) {
  const cat = { id: `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`, name, singular: singular || name, status: 'active' };
  writeRaw(KEYS.categories, [...getCategories(), cat]);
  logActivity(`Category created: ${name}`);
  return cat;
}
export function updateCategory(id, patch) {
  const categories = getCategories();
  const existing = categories.find((c) => c.id === id);
  writeRaw(KEYS.categories, categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  if (existing && patch.name && patch.name !== existing.name) {
    writeRaw(
      KEYS.venues,
      getVenues().map((v) =>
        v.tab === existing.name ? { ...v, tab: patch.name, category: patch.singular || v.category } : v,
      ),
    );
  }
  logActivity(`Category updated: ${patch.name || existing?.name || id}`);
}
export function deleteCategory(id) {
  const existing = getCategories().find((c) => c.id === id);
  writeRaw(KEYS.categories, getCategories().filter((c) => c.id !== id));
  if (existing) logActivity(`Category deleted: ${existing.name}`);
}
export function venueCountForCategory(name) {
  return getVenues().filter((v) => v.tab === name).length;
}

// ---------------------------------------------------------- price overrides
const overrideKey = (venueId, itemId) => `${venueId}::${itemId}`;
export function getPriceOverrides() {
  return readRaw(KEYS.priceOverrides, {});
}
export function getEffectivePrice(venueId, itemId, fallback) {
  return getPriceOverrides()[overrideKey(venueId, itemId)] ?? fallback;
}
export function setPriceOverride(venueId, itemId, price) {
  writeRaw(KEYS.priceOverrides, { ...getPriceOverrides(), [overrideKey(venueId, itemId)]: price });
}

// ------------------------------------------------------------------reports
export function getReports() {
  return readRaw(KEYS.reports, []);
}
export function addReport(venue, item, reportedPrice, note) {
  const report = {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    venueId: venue.id,
    venueName: venue.name,
    itemId: item.id,
    itemName: item.name,
    itemImage: item.image,
    currentPrice: getEffectivePrice(venue.id, item.id, item.price),
    reportedPrice,
    note: note || '',
    date: new Date().toISOString(),
    status: 'pending',
  };
  writeRaw(KEYS.reports, [report, ...getReports()]);
  logActivity(`New price report: ${item.name} at ${venue.name}`);
  return report;
}
export function updateReportStatus(id, status) {
  const reports = getReports();
  const report = reports.find((r) => r.id === id);
  writeRaw(KEYS.reports, reports.map((r) => (r.id === id ? { ...r, status } : r)));
  if (report && status === 'resolved') {
    setPriceOverride(report.venueId, report.itemId, report.reportedPrice);
  }
  if (report) logActivity(`Report marked ${status}: ${report.itemName} at ${report.venueName}`);
}
export function deleteReport(id) {
  writeRaw(KEYS.reports, getReports().filter((r) => r.id !== id));
}

// --------------------------------------------------------------------users
export function getUsers() {
  return readRaw(KEYS.users, []);
}
export function updateUser(id, patch) {
  const user = getUsers().find((u) => u.id === id);
  writeRaw(KEYS.users, getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u)));
  if (user) logActivity(`User ${patch.status ? patch.status : 'updated'}: ${user.email}`);
}
export function deleteUser(id) {
  const user = getUsers().find((u) => u.id === id);
  writeRaw(KEYS.users, getUsers().filter((u) => u.id !== id));
  if (user) logActivity(`User deleted: ${user.email}`);
}

// ------------------------------------------------------------ notifications
export function getNotifications() {
  return readRaw(KEYS.notifications, []);
}
export function pushNotification({ title, body, target = 'All Users' }) {
  const n = {
    id: `note-${Date.now()}`,
    title,
    body,
    target,
    time: new Date().toISOString(),
    read: false,
    group: 'recent',
  };
  writeRaw(KEYS.notifications, [n, ...getNotifications()]);
  logActivity(`Push notification sent${target !== 'All Users' ? ` to ${target}` : ' to all users'}: ${title}`);
  return n;
}

// ------------------------------------------------------------ hidden reviews
export function getHiddenReviewIds() {
  return readRaw(KEYS.hiddenReviews, []);
}
export function hideReview(id) {
  writeRaw(KEYS.hiddenReviews, Array.from(new Set([...getHiddenReviewIds(), id])));
  logActivity(`Review hidden: ${id}`);
}
export function unhideReview(id) {
  writeRaw(KEYS.hiddenReviews, getHiddenReviewIds().filter((x) => x !== id));
}

// ----------------------------------------------------------- visitor stats
export function getVisitorStats() {
  return readRaw(KEYS.visitorStats, { daily: [], hourly: [] });
}

// ------------------------------------------------------------- admin theme
export function getAdminTheme() {
  return readRaw(KEYS.adminTheme, 'light');
}
export function setAdminTheme(theme) {
  writeRaw(KEYS.adminTheme, theme);
}

// ----------------------------------------------------------- admin profile
export function getAdminProfile() {
  return readRaw(KEYS.adminProfile, {
    firstName: 'Admin',
    lastName: 'User',
    email: 'demo@admin.com',
    role: 'Owner',
    photo: null,
  });
}
export function updateAdminProfile(patch) {
  writeRaw(KEYS.adminProfile, { ...getAdminProfile(), ...patch });
  logActivity('Admin profile updated');
}

// ---------------------------------------------------------- admin password
export function getAdminPassword() {
  return readRaw(KEYS.adminPassword, 'admin123');
}
export function setAdminPassword(password) {
  writeRaw(KEYS.adminPassword, password);
  logActivity('Admin password changed');
}

// ------------------------------------------------------------------agents
export function getAgents() {
  return readRaw(KEYS.agents, []);
}
export function addAgent({ firstName, lastName, email, password }) {
  const agent = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    firstName,
    lastName,
    email,
    password,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  writeRaw(KEYS.agents, [agent, ...getAgents()]);
  logActivity(`Agent account created: ${email}`);
  return agent;
}
export function updateAgent(id, patch) {
  const agent = getAgents().find((a) => a.id === id);
  writeRaw(KEYS.agents, getAgents().map((a) => (a.id === id ? { ...a, ...patch } : a)));
  if (agent && patch.status) logActivity(`Agent ${patch.status}: ${agent.email}`);
}
export function deleteAgent(id) {
  const agent = getAgents().find((a) => a.id === id);
  writeRaw(KEYS.agents, getAgents().filter((a) => a.id !== id));
  if (agent) logActivity(`Agent account deleted: ${agent.email}`);
}
export function resetAgentPassword(id) {
  const tempPassword = Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 10);
  const agent = getAgents().find((a) => a.id === id);
  writeRaw(KEYS.agents, getAgents().map((a) => (a.id === id ? { ...a, password: tempPassword } : a)));
  if (agent) logActivity(`Password reset for agent: ${agent.email}`);
  return tempPassword;
}

// --------------------------------------------------------------- React glue
function useStoreValue(getter) {
  return useSyncExternalStore(subscribe, getter, getter);
}

export const useVenuesStore = () => useStoreValue(getVenues);
export const useCategoriesStore = () => useStoreValue(getCategories);
export const useUsersStore = () => useStoreValue(getUsers);
export const useReportsStore = () => useStoreValue(getReports);
export const useNotificationsStore = () => useStoreValue(getNotifications);
export const usePriceOverridesStore = () => useStoreValue(getPriceOverrides);
export const useHiddenReviewIdsStore = () => useStoreValue(getHiddenReviewIds);
export const useActivityStore = () => useStoreValue(getActivity);
export const useAdminAuthStore = () => useStoreValue(getAdminAuth);
export const useAdminThemeStore = () => useStoreValue(getAdminTheme);
export const useAdminProfileStore = () => useStoreValue(getAdminProfile);
export const useAgentsStore = () => useStoreValue(getAgents);

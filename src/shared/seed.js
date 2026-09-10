// Default/seed data for the shared store. Runs once — if a localStorage key
// already exists, these are never called again, so admin edits always win.
import { VENUES, CATEGORIES, CATEGORY_SINGULAR } from '../data/venues';
import { NOTIFICATIONS } from '../data/notifications';
import { seededRandom } from '../utils/seededRandom';

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildDefaultVenues() {
  return VENUES.map((v) => ({ ...v, published: true }));
}

export function buildDefaultCategories() {
  return CATEGORIES.filter((c) => c !== 'All').map((name) => ({
    id: slugify(name),
    name,
    singular: CATEGORY_SINGULAR[name] || name,
    status: 'active',
  }));
}

export function buildDefaultNotifications() {
  return NOTIFICATIONS;
}

const FIRST_NAMES = [
  'Ada', 'Tunde', 'Chiamaka', 'Segun', 'Ifeoma', 'Emeka', 'Funmilayo', 'Uche',
  'Blessing', 'Kola', 'Ngozi', 'Bayo', 'Amaka', 'Chinedu', 'Halima', 'Yemi',
];
const LAST_NAMES = [
  'Eze', 'Bakare', 'Obi', 'Adeyemi', 'Nwosu', 'Chukwu', 'Bello', 'Okafor',
  'Etim', 'Ogundimu', 'Umeh', 'Fashola', 'Duru', 'Anyanwu', 'Yusuf', 'Adio',
];

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function buildDefaultUsers() {
  const rand = seededRandom('admin-users-seed');
  const users = [];
  for (let i = 0; i < 16; i += 1) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3 + 2) % LAST_NAMES.length];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@${rand() > 0.5 ? 'gmail.com' : 'yahoo.com'}`;
    users.push({
      id: `u${i + 1}`,
      name: `${first} ${last}`,
      email,
      joined: daysAgoISO(5 + Math.floor(rand() * 300)),
      status: rand() > 0.85 ? 'suspended' : 'active',
      plans: Math.floor(rand() * 25),
      reports: Math.floor(rand() * 10),
    });
  }
  return users;
}

const REPORT_SPECS = [
  { venueId: 'shiro-lagos', itemId: 'm1', daysAgo: 1, reportedPrice: 9500, note: 'Now includes a side of plantain.', status: 'pending' },
  { venueId: 'shiro-lagos', itemId: 'm2', daysAgo: 4, reportedPrice: 3000, note: '', status: 'resolved' },
  { venueId: 'rsvp-restaurant', itemId: 'm4', daysAgo: 2, reportedPrice: 21000, note: 'Price changed on weekends.', status: 'pending' },
  { venueId: 'rsvp-restaurant', itemId: 'm1', daysAgo: 7, reportedPrice: 11500, note: '', status: 'reviewed' },
  { venueId: 'cilantro-lagos', itemId: 'm2', daysAgo: 3, reportedPrice: 5000, note: '', status: 'pending' },
  { venueId: 'z-kitchen', itemId: 'm2', daysAgo: 9, reportedPrice: 8800, note: 'Smaller size now.', status: 'resolved' },
  { venueId: 'hard-rock-cafe', itemId: 'm1', daysAgo: 1, reportedPrice: 9200, note: '', status: 'pending' },
  { venueId: 'hard-rock-cafe', itemId: 'a1', daysAgo: 6, reportedPrice: 48000, note: 'Weekend rate is higher.', status: 'pending' },
  { venueId: 'the-wheatbaker', itemId: 'a2', daysAgo: 5, reportedPrice: 20000, note: '', status: 'reviewed' },
  { venueId: 'landmark-beach', itemId: 'a2', daysAgo: 2, reportedPrice: 22000, note: 'Fuel surcharge added.', status: 'pending' },
];

function resolveItem(venueId, itemId) {
  const venue = VENUES.find((v) => v.id === venueId);
  if (!venue) return null;
  const item = venue.menu.find((i) => i.id === itemId) || venue.activities.find((i) => i.id === itemId);
  if (!item) return null;
  return { venue, item };
}

export function buildDefaultReports() {
  return REPORT_SPECS.map((spec, i) => {
    const resolved = resolveItem(spec.venueId, spec.itemId);
    if (!resolved) return null;
    const { venue, item } = resolved;
    return {
      id: `seed-report-${i}`,
      venueId: venue.id,
      venueName: venue.name,
      itemId: item.id,
      itemName: item.name,
      itemImage: item.image,
      currentPrice: item.price,
      reportedPrice: spec.reportedPrice,
      note: spec.note,
      date: daysAgoISO(spec.daysAgo),
      status: spec.status,
    };
  }).filter(Boolean);
}

export function seedPriceOverridesFromReports(reports) {
  const map = {};
  reports.filter((r) => r.status === 'resolved').forEach((r) => {
    map[`${r.venueId}::${r.itemId}`] = r.reportedPrice;
  });
  return map;
}

export function buildDefaultActivity() {
  const items = [
    { message: 'New venue added: Omu Resort', daysAgo: 12 },
    { message: 'Category "Picnic Spots" created', daysAgo: 11 },
    { message: 'Price report resolved: Smashed Avo at Shiro Lagos', daysAgo: 4 },
    { message: 'Venue published: Sky Lounge Eko', daysAgo: 3 },
    { message: 'New user registered: Halima Yusuf', daysAgo: 2 },
    { message: 'Notification sent to all users: Weekend picks near you', daysAgo: 1 },
  ];
  return items.map((it, i) => ({
    id: `seed-activity-${i}`,
    message: it.message,
    time: daysAgoISO(it.daysAgo),
  }));
}

function hourKey(d) {
  return `${d.toISOString().slice(0, 13)}:00`;
}

export function buildVisitorStats() {
  const rand = seededRandom('visitor-stats-seed');
  const daily = [];
  let base = 220;
  for (let i = 364; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weekday = d.getDay();
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.25 : 1;
    const swing = 1 + (rand() - 0.5) * 0.3;
    base = Math.max(60, base * (1 + (rand() - 0.5) * 0.04));
    const count = Math.round(base * weekendBoost * swing);
    daily.push({ date: d.toISOString().slice(0, 10), count });
  }

  const hourly = [];
  const now = new Date();
  for (let i = 23; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(d.getHours() - i, 0, 0, 0);
    const hour = d.getHours();
    const activityCurve = hour >= 10 && hour <= 22 ? 1 : 0.35;
    const count = Math.round((20 + rand() * 40) * activityCurve);
    hourly.push({ date: hourKey(d), count });
  }

  return { daily, hourly };
}

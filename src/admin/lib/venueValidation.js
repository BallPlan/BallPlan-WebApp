// Required-field rules for the venue form (admin, support and agent use the
// same rules). Returns per-field messages the form shows inline, plus a
// short list for the "please complete…" toast. An item/fee row counts as
// "in use" once anything is typed into it; a completely empty row is
// ignored (it's dropped on save).
import { isValidNigeriaPhone } from '../../components/NigeriaPhoneInput';
import { itemLabels } from '../../utils/itemLabels';

const blank = (v) => !String(v ?? '').trim();
const itemInUse = (i) => !blank(i.name) || !blank(i.price) || !blank(i.image) || !blank(i.desc) || !blank(i.section);
const feeInUse = (f) => !blank(f.label) || !blank(f.amount);

// Item categories become buttons on the venue page (Food, Drinks, Rides),
// so they must be short: 1–2 words. Longer text belongs in the description.
export const MAX_SECTION_WORDS = 2;
export const sectionTooLong = (section) => String(section ?? '').trim().split(/\s+/).filter(Boolean).length > MAX_SECTION_WORDS;
export const SECTION_TOO_LONG_MSG = 'Category must be 1–2 words (e.g. Food, Rides). Put longer text in the description.';

function itemErrors(item, sectionOptional) {
  const e = {};
  if (blank(item.name)) e.name = 'Name required';
  if (!(Number(item.price) > 0)) e.price = 'Price required';
  if (blank(item.section)) {
    if (!sectionOptional) e.section = 'Category required';
  }
  else if (sectionTooLong(item.section)) e.section = SECTION_TOO_LONG_MSG;
  if (blank(item.image)) e.image = 'Image required';
  return e;
}

export function validateVenue(venue) {
  const errors = { gallery: {}, menu: {}, activities: {}, fees: {} };
  const summary = [];

  if (blank(venue.name)) errors.name = 'Venue name required';
  if (blank(venue.tab)) errors.tab = 'Choose a category';
  if (blank(venue.description)) errors.description = 'Description required';
  if (blank(venue.openTime)) errors.openTime = 'Open time required';
  if (blank(venue.closeTime)) errors.closeTime = 'Close time required';
  const rating = Number(venue.rating);
  if (blank(venue.rating) || Number.isNaN(rating) || rating < 0 || rating > 5) errors.rating = 'Rating must be 0–5';
  if (blank(venue.location)) errors.location = 'Area required';
  if (blank(venue.address)) errors.address = 'Full address required';
  if (blank(venue.phone)) errors.phone = 'Phone required';
  else if (!isValidNigeriaPhone(venue.phone)) errors.phone = 'Must be 10 digits, e.g. 803 123 4567';

  const fieldLabels = {
    name: 'venue name',
    tab: 'category',
    description: 'description',
    openTime: 'open time',
    closeTime: 'close time',
    rating: 'rating',
    location: 'area',
    address: 'full address',
    phone: 'phone',
  };
  Object.entries(fieldLabels).forEach(([k, label]) => errors[k] && summary.push(label));

  if (blank(venue.hero) && !(venue.gallery || []).some((g) => !blank(g))) {
    errors.hero = 'Add at least one photo or video of the venue';
    summary.push('venue photo/video');
  }
  (venue.gallery || []).forEach((g, i) => {
    if (blank(g)) errors.gallery[i] = 'Add a photo/video or remove this row';
  });
  const emptyRows = Object.keys(errors.gallery).length;
  if (emptyRows) summary.push(`${emptyRows} empty photo/video row${emptyRows > 1 ? 's' : ''}`);

  // Items: every row in use needs name, price, category and image.
  const L = itemLabels(venue);
  [
    ['menu', L.menuItem],
    ['activities', L.activityItem],
  ].forEach(([key, noun]) => {
    (venue[key] || []).forEach((item, i) => {
      if (!itemInUse(item)) return;
      const e = itemErrors(item, L.sectionOptional);
      if (Object.keys(e).length) {
        errors[key][i] = e;
        const missing = Object.values(e).map((m) => m.replace(' required', '').toLowerCase());
        summary.push(`${noun} “${item.name?.trim() || `#${i + 1}`}” (${missing.join(', ')})`);
      }
    });
  });

  const activityCount = (venue.activities || []).filter(itemInUse).length;
  if (!venue.hasMenu && !venue.hasActivities) {
    errors.kinds = `Tick “Has ${L.menu.toLowerCase()}” and/or “Has ${L.activities.toLowerCase()}”`;
    summary.push(`has ${L.menu.toLowerCase()} / has ${L.activities.toLowerCase()}`);
  }
  // Menu items are optional: a venue can be listed before its menu is added.
  if (venue.hasActivities && activityCount === 0) {
    errors.activitiesList = `Add at least one ${L.activityItem} (or untick “Has ${L.activities.toLowerCase()}”)`;
    summary.push(`at least one ${L.activityItem}`);
  }

  (venue.hiddenFees || []).forEach((f, i) => {
    if (!feeInUse(f)) return;
    const e = {};
    if (blank(f.label)) e.label = 'Label required';
    if (blank(f.amount)) e.amount = 'Amount required';
    if (Object.keys(e).length) {
      errors.fees[i] = e;
      summary.push(`fee “${f.label?.trim() || `#${i + 1}`}”`);
    }
  });

  return { errors, summary, valid: summary.length === 0 };
}

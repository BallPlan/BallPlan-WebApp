// Deterministic mock reviews — no backend, but stable across reloads so a
// given venue always shows the same seeded reviews. User-submitted reviews
// (see ReviewsContext) are stored separately and merged on top.
import { seededRandom } from '../utils/seededRandom';

const FIRST_NAMES = [
  'Ada', 'Tunde', 'Chiamaka', 'Segun', 'Ifeoma', 'Emeka', 'Funmilayo', 'Uche',
  'Blessing', 'Kola', 'Ngozi', 'Bayo', 'Amaka', 'Chinedu', 'Halima', 'Yemi',
  'Ola', 'Ijeoma', 'Tobi', 'Zainab', 'Chidi', 'Aisha', 'Femi', 'Nkechi', 'Dapo',
];
const LAST_INITIALS = ['E', 'B', 'O', 'A', 'N', 'C', 'F', 'U', 'M', 'K', 'D', 'S', 'Y', 'T'];

const POSITIVE_SNIPPETS = [
  'Honestly exceeded expectations, will definitely be back.',
  'Great vibe and the staff were super attentive all evening.',
  'Prices matched what BallPlan showed — refreshing, honestly.',
  "One of the better spots I've tried in Lagos this year.",
  'Loved the atmosphere, perfect for a weekend outing.',
  'Service was quick and the place was spotless.',
  'Would recommend to anyone planning an outing nearby.',
  'Exactly as described, no surprise charges at the till.',
  'Booked on a whim and it turned out to be a great call.',
  'Staff went out of their way to make the visit special.',
  'Clean, well-run, and worth every naira we spent.',
  "Second time here and it's just as good as the first.",
  'Great for a group outing, everyone found something they liked.',
  'The kind of place that makes planning an outing easy.',
];

const MIXED_SNIPPETS = [
  'Decent overall but got a little pricey with the extra charges.',
  'Nice spot, though it was more crowded than I expected.',
  'Good experience, just wish the wait time was shorter.',
  'Solid choice for the price, nothing spectacular though.',
  "It was fine — met expectations but didn't blow me away.",
  'Average visit, might try somewhere else next time.',
  'Alright for a one-off, not sure it earns a repeat visit.',
];

const NEGATIVE_SNIPPETS = [
  "Prices had gone up since my last visit, wasn't reflected here yet.",
  "Service was slower than I'd have liked for a weekday.",
  'Expected a bit more for what we paid.',
  'Had a rough time finding parking, otherwise okay.',
  'Would think twice before recommending it to friends.',
];

function pickStar(rand, baseRating) {
  const swing = (rand() - 0.5) * 2.6;
  return Math.min(5, Math.max(1, Math.round(baseRating + swing)));
}

// Avoids repeating the same line twice within one venue's review list —
// only falls back to a repeat once every unique option has been used.
function snippetFor(star, rand, used) {
  const pool = star >= 4 ? POSITIVE_SNIPPETS : star === 3 ? MIXED_SNIPPETS : NEGATIVE_SNIPPETS;
  const available = pool.filter((s) => !used.has(s));
  const choices = available.length ? available : pool;
  const pick = choices[Math.floor(rand() * choices.length)];
  used.add(pick);
  return pick;
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function getSeedReviews(venue) {
  const rand = seededRandom(`reviews:${venue.id}`);
  const count = 3 + Math.floor(rand() * 5); // 3-7 reviews
  const usedSnippets = new Set();
  const reviews = [];
  for (let i = 0; i < count; i += 1) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)];
    const star = pickStar(rand, venue.rating);
    reviews.push({
      id: `seed-${venue.id}-${i}`,
      name: `${first} ${last}.`,
      rating: star,
      text: snippetFor(star, rand, usedSnippets),
      date: daysAgoISO(3 + Math.floor(rand() * 180)),
      seeded: true,
    });
  }
  return reviews;
}

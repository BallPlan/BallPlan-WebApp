// Deterministic mock price history — no backend, but stable across reloads so
// the same item always shows the same trend. Seeded from the item's own id/name.
import { seededRandom } from './seededRandom';

const WEEKS = 6;

export function getPriceHistory(item) {
  const rand = seededRandom(`${item.id}:${item.name}`);

  // Walk backwards from the live price to a plausible history, then reverse
  // so the series reads oldest -> newest and always ends on item.price.
  const points = [item.price];
  let price = item.price;
  for (let i = 1; i < WEEKS; i += 1) {
    const swing = (rand() - 0.5) * 0.16; // ~±8% week over week
    price = Math.max(500, Math.round(price / (1 + swing) / 100) * 100);
    points.push(price);
  }
  points.reverse();

  const prev = points[points.length - 2];
  const current = points[points.length - 1];
  const changePct = prev ? Math.round(((current - prev) / prev) * 100) : 0;
  const trend = changePct >= 3 ? 'up' : changePct <= -3 ? 'down' : 'flat';

  const daysAgo = 1 + Math.floor(rand() * 13);
  const verifiedCount = 3 + Math.floor(rand() * 40);

  return { points, trend, changePct, daysAgo, verifiedCount };
}

// A venue's "from" price: its cheapest menu/activity item. Only items that
// were actually entered (a name and a typed price) count, and ₦0 counts too
// (free entry at Experiences venues). null when there are none.
export function cheapestItemPrice(venue) {
  const prices = [...(venue.menu || []), ...(venue.activities || [])]
    .filter((i) => String(i.name ?? '').trim() && String(i.price ?? '').trim() !== '')
    .map((i) => Number(i.price))
    .filter((p) => Number.isFinite(p) && p >= 0);
  return prices.length ? Math.min(...prices) : null;
}

export function formatNaira(amount) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

// A single item's price: ₦0 items (free entry at Experiences) read "Free".
export function formatItemPrice(amount) {
  return Number(amount) === 0 ? 'Free' : formatNaira(amount);
}

// True when a venue's cheapest item is genuinely free (a ₦0 item exists),
// as opposed to from_price being 0 just because it has no priced items.
export function isFreeFrom(venue) {
  return !(Number(venue?.fromPrice) > 0) && [...(venue?.menu || []), ...(venue?.activities || [])].some((i) => String(i.price ?? '').trim() !== '' && Number(i.price) === 0);
}

// A venue's "from" price, or "Free" when its cheapest item is free.
export function formatFromPrice(venue) {
  return isFreeFrom(venue) ? 'Free' : formatNaira(venue?.fromPrice);
}

// Hidden-fee amounts are free text ("7.5%", "₦2,000 per car", …). A whole
// number — stored as a number, or typed as digits with optional commas —
// still shows as naira; anything else (including a bare "5.5", which is
// more likely a percentage missing its %) shows exactly as entered.
const PLAIN_NUMBER = /^\d[\d,]*$/;

export function parseFeeAmount(value) {
  const text = String(value ?? '').trim();
  return PLAIN_NUMBER.test(text) ? Number(text.replace(/,/g, '')) : text;
}

export function formatFeeAmount(amount) {
  if (typeof amount === 'number') return formatNaira(amount);
  const text = String(amount ?? '').trim();
  return PLAIN_NUMBER.test(text) ? formatNaira(text.replace(/,/g, '')) : text;
}

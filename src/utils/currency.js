export function formatNaira(amount) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
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

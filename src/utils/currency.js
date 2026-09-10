export function formatNaira(amount) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

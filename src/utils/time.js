function toMinutes(timeStr) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr.trim());
  if (!match) return null;
  let [, h, m, ampm] = match;
  h = Number(h) % 12;
  if (ampm.toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m);
}

export function isOpenNow(openTime, closeTime) {
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  if (open == null || close == null) return true;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (close === open) return true; // 24 hours
  if (close > open) return nowMinutes >= open && nowMinutes < close;
  // overnight venue (closes past midnight)
  return nowMinutes >= open || nowMinutes < close;
}

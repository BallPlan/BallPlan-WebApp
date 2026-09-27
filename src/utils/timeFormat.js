// Converts between the app's stored display format for opening hours
// ("9:00 AM", read by src/utils/time.js and shown on Details.jsx) and the
// value format <input type="time"> needs ("09:00", 24-hour) — so the admin/
// agent forms can use a real time picker without changing what's stored or
// how the consumer site reads it.
export function to24Hour(display) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((display || '').trim());
  if (!m) return '';
  let [, h, mins, ampm] = m;
  h = Number(h) % 12;
  if (ampm.toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${mins}`;
}

export function to12Hour(value24) {
  if (!value24) return '';
  const [h, m] = value24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

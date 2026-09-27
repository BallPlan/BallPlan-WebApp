// All 36 Nigerian states plus the FCT, for the admin/agent venue form's
// State dropdown.
export const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa',
  'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  'Abuja',
];

// The DB only has one `location` column ("Ikeja, Lagos"), so the form's
// separate Area + State fields are combined into it on save and split back
// apart when editing. State defaults to Lagos — every venue today is one —
// when the stored value doesn't end in a name we recognise.
export function splitLocation(full) {
  const trimmed = (full || '').trim();
  const idx = trimmed.lastIndexOf(',');
  if (idx === -1) return { area: trimmed, state: 'Lagos' };
  const area = trimmed.slice(0, idx).trim();
  const tail = trimmed.slice(idx + 1).trim();
  const match = NIGERIA_STATES.find((s) => s.toLowerCase() === tail.toLowerCase());
  return match ? { area, state: match } : { area: trimmed, state: 'Lagos' };
}

export function joinLocation(area, state) {
  const a = (area || '').trim();
  return a ? `${a}, ${state}` : state;
}

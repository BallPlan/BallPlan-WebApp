import { useMemo } from 'react';

// Strips everything but digits, then drops a leading trunk "0" or a typed
// "234" if present — so "08031234567" (11 digits), "8031234567" (10) and
// "2348031234567" all normalize to the same 10-digit local number.
function normalizeLocal(raw) {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('234')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidNigeriaPhone(value) {
  return normalizeLocal(value).length === 10;
}

// value/onChange carry the same "+234XXXXXXXXXX" string venues.phone stores.
export default function NigeriaPhoneInput({ value, onChange, className = '', placeholder = '803 123 4567', required }) {
  const local = useMemo(() => normalizeLocal(value), [value]);

  const handleChange = (e) => {
    const next = normalizeLocal(e.target.value);
    onChange(next ? `+234${next}` : '');
  };

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-xl border border-ink/12 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 dark:border-white/10 dark:bg-[#111217] ${className}`}
    >
      <span className="flex items-center border-r border-ink/12 bg-ink/5 px-3 text-sm font-semibold text-ink/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        +234
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={11}
        required={required}
        className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-ink outline-none dark:text-white"
      />
    </div>
  );
}

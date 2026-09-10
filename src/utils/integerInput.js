// Keeps price/budget inputs strictly whole-number digits — no letters, decimals,
// minus signs, or scientific notation (all of which a native type="number" still allows).

export function sanitizeDigits(value) {
  return value.replace(/[^\d]/g, '');
}

const ALLOWED_KEYS = [
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
];

export function blockNonDigitKeys(e) {
  if (ALLOWED_KEYS.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
}

// Spread onto an <input> to make it a clean digits-only field:
// <input {...integerInputProps(value, setValue)} />
export function integerInputProps(value, onChange) {
  return {
    type: 'text',
    inputMode: 'numeric',
    pattern: '[0-9]*',
    value,
    onChange: (e) => onChange(sanitizeDigits(e.target.value)),
    onKeyDown: blockNonDigitKeys,
  };
}

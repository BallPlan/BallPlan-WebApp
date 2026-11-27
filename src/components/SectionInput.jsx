import { useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';

// The short "Category" box on a menu item / activity row.
// Makes reusing a category one tap:
//   * while the box is empty, the most-used categories show as chips under
//     it ("Starters", "Drinks", …): tap one to fill it in;
//   * while typing, a list of matching categories drops down.
// `suggestions` is ordered best-first (this venue's categories, then ones
// this person used on their other venues, then general ones).
const CHIPS = 5;
const LIST = 8;

export default function SectionInput({ value, onChange, suggestions = [], className = '', ...inputProps }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const text = String(value || '').trim().toLowerCase();

  const matches = useMemo(() => {
    const list = text
      ? [
          ...suggestions.filter((s) => s.toLowerCase().startsWith(text)),
          ...suggestions.filter((s) => !s.toLowerCase().startsWith(text) && s.toLowerCase().includes(text)),
        ]
      : suggestions;
    return list.filter((s) => s.toLowerCase() !== text).slice(0, LIST);
  }, [suggestions, text]);

  const pick = (s) => {
    onChange(s);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (!open || !matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a <= 0 ? matches.length - 1 : a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        {...inputProps}
        value={value || ''}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={className}
      />

      {/* Drop-down while focused */}
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-card-hover dark:border-white/10 dark:bg-[#1c1c1e]">
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/35 dark:text-white/35">
            Suggestions
          </p>
          {matches.map((s, i) => (
            <button
              key={s}
              type="button"
              // mousedown (not click) so the input doesn't lose focus first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition ${
                i === active ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-cream dark:text-white dark:hover:bg-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* One-tap chips while empty and not focused */}
      {!text && !open && suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <History size={12} className="text-ink/35 dark:text-white/35" />
          {suggestions.slice(0, CHIPS).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className="rounded-full border border-brand/25 bg-brand/5 px-2.5 py-0.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white dark:border-brand/40 dark:bg-brand/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

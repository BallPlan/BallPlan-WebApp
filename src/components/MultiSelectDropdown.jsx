import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function MultiSelectDropdown({ value, onChange, options, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const filtered = options.filter((o) => !value.includes(o) && o.toLowerCase().includes(query.trim().toLowerCase()));

  const addOption = (opt) => {
    onChange([...value, opt]);
    setQuery('');
    inputRef.current?.focus();
  };

  const removeOption = (opt) => onChange(value.filter((v) => v !== opt));

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className="flex min-h-[52px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-2xl bg-white p-2.5 shadow-card outline-none transition focus-within:ring-2 focus-within:ring-brand/20 dark:bg-[#1c1c1e]"
      >
        {value.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-brand/10 py-1.5 pl-3 pr-2 text-xs font-semibold text-brand"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(v);
              }}
              className="rounded-full p-0.5 transition hover:bg-brand/20"
              aria-label={`Remove ${v}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : 'Add more...'}
          className="min-w-[100px] flex-1 bg-transparent px-1.5 py-1 text-sm text-ink outline-none placeholder:text-ink/40 dark:text-white dark:placeholder:text-white/40"
        />
        <ChevronDown
          size={15}
          className={`ml-auto shrink-0 text-ink/40 transition-transform dark:text-white/40 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-card-hover dark:bg-[#1c1c1e]">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-ink/40 dark:text-white/40">
              {options.length === value.length ? 'All options selected.' : 'No matches.'}
            </p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => addOption(opt)}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink/80 transition hover:bg-cream dark:text-white/80 dark:hover:bg-white/10"
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

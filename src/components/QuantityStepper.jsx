import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 0, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  return (
    <div className={`inline-flex items-center gap-3 rounded-full border border-ink/15 bg-white dark:border-white/15 dark:bg-white/5 ${pad}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-5 w-5 items-center justify-center text-ink transition hover:text-brand active:scale-90 dark:text-white"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[1rem] text-center text-sm font-semibold tabular-nums dark:text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-5 w-5 items-center justify-center text-ink transition hover:text-brand active:scale-90 dark:text-white"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

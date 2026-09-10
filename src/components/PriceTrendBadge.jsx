import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Status color, not categorical — a price going up is bad for the shopper (critical
// red), down is good (green); flat stays neutral ink. Always icon + label together.
const CONFIG = {
  up: { icon: TrendingUp, color: '#d03b3b', bg: 'rgba(208,59,59,0.09)', label: (pct) => `+${pct}%` },
  down: { icon: TrendingDown, color: '#0ca30c', bg: 'rgba(12,163,12,0.09)', label: (pct) => `${pct}%` },
  flat: { icon: Minus, color: '#898781', bg: 'rgba(137,135,129,0.09)', label: () => 'Steady' },
};

export default function PriceTrendBadge({ trend, changePct, size = 'sm', className = '' }) {
  const cfg = CONFIG[trend] || CONFIG.flat;
  const Icon = cfg.icon;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon size={isSmall ? 11 : 13} strokeWidth={2.5} />
      {cfg.label(changePct)}
    </span>
  );
}

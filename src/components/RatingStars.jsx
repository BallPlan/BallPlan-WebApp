import { Star } from 'lucide-react';

// Read-only stars that support fractional ratings (e.g. 4.3) via a clipped overlay.
export default function RatingStars({ rating, size = 14, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fillPct = Math.max(0, Math.min(1, rating - (n - 1))) * 100;
        return (
          <span key={n} className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-ink/15 dark:text-white/20" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
              <Star size={size} className="fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

import { Star } from 'lucide-react';

export default function RatingBadge({ rating, className = '', compact = false }) {
  return (
    <span
      className={`inline-flex items-center ${compact ? 'gap-0.5 sm:gap-1' : 'gap-1'} ${compact ? 'text-[11px] sm:text-sm' : 'text-sm'} font-semibold text-ink dark:text-white ${className}`}
    >
      <Star size={compact ? 11 : 15} className="fill-amber-400 text-amber-400" />
      {Number(rating).toFixed(1)}
    </span>
  );
}

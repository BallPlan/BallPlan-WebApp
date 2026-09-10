import { Star } from 'lucide-react';

export default function RatingBadge({ rating, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold text-ink dark:text-white ${className}`}>
      <Star size={15} className="fill-amber-400 text-amber-400" />
      {Number(rating).toFixed(1)}
    </span>
  );
}

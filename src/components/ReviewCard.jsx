import { Trash2 } from 'lucide-react';
import RatingStars from './RatingStars';

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function ReviewCard({ review, onDelete }) {
  return (
    <div className="flex gap-3 border-b border-ink/5 py-4 last:border-0 dark:border-white/10">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
        {initials(review.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-ink dark:text-white">{review.name}</p>
          {review.isMine && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">You</span>
          )}
          <span className="text-xs text-ink/35 dark:text-white/35">· {timeAgo(review.date)}</span>
        </div>
        <RatingStars rating={review.rating} size={13} className="mt-1" />
        <p className="mt-1.5 text-sm leading-relaxed text-ink/65 dark:text-white/65">{review.text}</p>
      </div>
      {review.isMine && onDelete && (
        <button
          onClick={onDelete}
          className="h-fit shrink-0 text-ink/25 transition hover:text-red-500 dark:text-white/25"
          aria-label="Delete your review"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

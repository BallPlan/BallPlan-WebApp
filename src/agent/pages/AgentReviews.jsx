import { useMemo, useState } from 'react';
import { Star, MessageSquare, EyeOff, Eye, Search } from 'lucide-react';
import StatCard from '../../admin/components/StatCard';
import { getSeedReviews } from '../../data/mockReviews';
import { useVenuesStore, getVenues } from '../lib/agentData';
import { useHiddenReviewIdsStore, getHiddenReviewIds, hideReview, unhideReview } from '../../shared/store';
import { useLocalStorage } from '../../utils/useLocalStorage';
import { useToast } from '../../context/ToastContext';

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AgentReviews() {
  const [query, setQuery] = useState('');
  const { notify } = useToast();

  const venuesSnapshot = useVenuesStore();
  const hiddenSnapshot = useHiddenReviewIdsStore();
  const [userReviews] = useLocalStorage('ballplan_user_reviews', {});

  const allReviews = useMemo(() => {
    const venues = getVenues();
    const list = [];
    venues.forEach((venue) => {
      const seeded = getSeedReviews(venue);
      const mine = userReviews[venue.id] || [];
      [...mine, ...seeded].forEach((r) => list.push({ ...r, venueId: venue.id, venueName: venue.name }));
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venuesSnapshot, userReviews]);

  const hiddenIds = useMemo(() => getHiddenReviewIds(), [hiddenSnapshot]);

  const filtered = useMemo(
    () => allReviews.filter((r) => `${r.venueName} ${r.name} ${r.text}`.toLowerCase().includes(query.toLowerCase())),
    [allReviews, query],
  );

  const avgRating = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;

  const toggleHide = (review) => {
    if (hiddenIds.includes(review.id)) {
      unhideReview(review.id);
      notify('Review restored.', 'success');
    } else {
      hideReview(review.id);
      notify('Review hidden from the storefront.', 'info');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Reviews</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Reviews left across the venues you've posted.</p>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-56 rounded-full bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-brand/20 dark:bg-[#1a1b20] dark:text-white"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard label="Total Reviews" value={allReviews.length} icon={MessageSquare} tone="brand" />
        <StatCard label="Average Rating" value={avgRating.toFixed(1)} icon={Star} tone="amber" />
      </div>

      <div className="mt-5 space-y-3">
        {filtered.map((review) => {
          const hidden = hiddenIds.includes(review.id);
          return (
            <div
              key={review.id}
              className={`flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card dark:bg-[#1a1b20] sm:flex-row sm:items-center ${
                hidden ? 'opacity-50' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink dark:text-white">{review.name}</p>
                  <span className="text-xs text-ink/40 dark:text-white/40">· {review.venueName}</span>
                  {hidden && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink/50 dark:bg-white/10 dark:text-white/50">Hidden</span>}
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-ink/15 dark:text-white/15'} />
                  ))}
                  <span className="ml-1.5 text-xs text-ink/35 dark:text-white/35">{timeAgo(review.date)}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink/65 dark:text-white/65">{review.text}</p>
              </div>
              <button
                onClick={() => toggleHide(review)}
                className={`flex shrink-0 items-center gap-1.5 self-start rounded-full px-3.5 py-2 text-xs font-bold transition sm:self-center ${
                  hidden
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'border border-ink/15 text-ink/60 hover:border-red-300 hover:text-red-500 dark:border-white/15 dark:text-white/60'
                }`}
              >
                {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                {hidden ? 'Restore' : 'Hide'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">
            {allReviews.length === 0 ? 'No reviews on your venues yet.' : 'No reviews match your search.'}
          </p>
        )}
      </div>
    </div>
  );
}

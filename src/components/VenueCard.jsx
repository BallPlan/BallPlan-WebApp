import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import RatingBadge from './RatingBadge';
import { formatNaira } from '../utils/currency';
import { useFavorites } from '../context/FavoritesContext';

// `compact` (Home, Favorites, Search): two-up on phones like the design — tighter
// padding, smaller type, one-line description. From sm: up it's the
// normal card, so tablet/desktop grids are unchanged. On phones the
// Details button is a round arrow icon so it always fits beside the price.
export default function VenueCard({ venue, index = 0, compact = false }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(venue.id);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(venue.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
      whileHover={{ y: -6 }}
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:bg-[#1c1c1e]"
      onClick={() => navigate(`/details/${venue.id}`)}
    >
      <div className={`relative overflow-hidden ${compact ? 'aspect-[3/2] sm:aspect-[4/3]' : 'aspect-[4/3]'}`}>
        <ImageWithFallback
          src={venue.hero}
          seed={venue.id}
          alt={venue.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`absolute ${(compact ? 'right-2 top-2 h-7 w-7 sm:right-3 sm:top-3 sm:h-9 sm:w-9' : 'right-3 top-3 h-9 w-9')} flex items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-90`}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={compact ? 15 : 17}
            className={favorited ? 'fill-brand text-brand' : 'text-ink/70'}
          />
        </button>
      </div>

      <div className={`flex flex-1 flex-col ${(compact ? 'gap-1 p-2.5 sm:gap-2 sm:p-4' : 'gap-2 p-4')}`}>
        <div className={`flex justify-between ${compact ? 'items-center gap-1.5 sm:items-start sm:gap-2' : 'items-start gap-2'}`}>
          <h3 className={`${(compact ? 'min-w-0 flex-1 truncate text-[13px] leading-snug sm:overflow-visible sm:whitespace-normal sm:text-base sm:leading-tight' : 'text-base leading-tight')} font-bold text-ink dark:text-white`}>{venue.name}</h3>
          <RatingBadge rating={venue.rating} compact={compact} className="shrink-0" />
        </div>
        <p className={`${(compact ? 'truncate text-[11px] sm:overflow-visible sm:whitespace-normal sm:text-sm' : 'text-sm')} text-ink/60 dark:text-white/60`}>
          {venue.category} <span className="mx-1 text-ink/30 dark:text-white/30">|</span> {venue.location}
        </p>
        <p className={`${(compact ? 'line-clamp-1 text-[11px] sm:line-clamp-2 sm:text-sm' : 'line-clamp-2 text-sm')} text-ink/50 dark:text-white/50`}>{venue.description}</p>

        <div
          className={`mt-auto flex items-center justify-between gap-1 ${
            compact ? 'pt-1.5 sm:flex-wrap sm:pt-3' : 'flex-wrap pt-3'
          }`}
        >
          <p className={`${(compact ? 'min-w-0 truncate text-[10px] sm:text-sm' : 'text-sm')} whitespace-nowrap text-ink/60 dark:text-white/60`}>
            from <span className={`${(compact ? 'text-[13px] sm:text-base' : 'text-base')} font-bold text-brand`}>{formatNaira(venue.fromPrice)}</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/details/${venue.id}`);
            }}
            aria-label={`View details for ${venue.name}`}
            className={`flex shrink-0 items-center justify-center rounded-full bg-brand ${(compact ? 'h-7 w-7 sm:h-auto sm:w-auto sm:px-4 sm:py-1.5 sm:text-sm' : 'px-4 py-1.5 text-sm')} font-semibold text-white shadow-sm transition hover:bg-brand-dark`}
          >
            {compact ? (
              <>
                <ArrowRight size={15} strokeWidth={2.5} className="sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Details</span>
              </>
            ) : (
              'Details'
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import RatingBadge from './RatingBadge';
import { formatNaira } from '../utils/currency';
import { useFavorites } from '../context/FavoritesContext';

export default function VenueCard({ venue, index = 0 }) {
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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:bg-[#1c1c1e]"
      onClick={() => navigate(`/details/${venue.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={venue.hero}
          seed={venue.id}
          alt={venue.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-90"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={17}
            className={favorited ? 'fill-brand text-brand' : 'text-ink/70'}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-tight text-ink dark:text-white">{venue.name}</h3>
          <RatingBadge rating={venue.rating} className="shrink-0" />
        </div>
        <p className="text-sm text-ink/60 dark:text-white/60">
          {venue.category} <span className="mx-1 text-ink/30 dark:text-white/30">|</span> {venue.location}
        </p>
        <p className="line-clamp-2 text-sm text-ink/50 dark:text-white/50">{venue.description}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-sm text-ink/60 dark:text-white/60">
            from <span className="text-base font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/details/${venue.id}`);
            }}
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Details
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

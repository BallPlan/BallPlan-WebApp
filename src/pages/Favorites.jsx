import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartOff } from 'lucide-react';
import VenueCard from '../components/VenueCard';
import BackButton from '../components/BackButton';
import { useFavorites } from '../context/FavoritesContext';
import { useVenuesStore, getVenues } from '../shared/store';

export default function Favorites() {
  const { favoriteIds } = useFavorites();
  const navigate = useNavigate();
  useVenuesStore();
  const favorites = getVenues().filter((v) => favoriteIds.includes(v.id));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink dark:text-white">Your Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/5"
        >
          <HeartOff size={44} className="text-ink/20 dark:text-white/20" />
          <h3 className="mt-4 text-xl font-bold text-ink dark:text-white">No favorites yet</h3>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Tap the heart icon on any place to save it here.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-full bg-ink px-8 py-3 text-sm font-semibold text-white shadow-card-hover transition hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90"
          >
            Explore Venues
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((venue, i) => (
            <VenueCard venue={venue} key={venue.id} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

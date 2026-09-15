import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('favorites')
      .select('venue_id')
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setFavoriteIds(data.map((row) => row.venue_id));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Callers are expected to check for a signed-in user themselves (and
  // prompt sign-in if not) before calling this — see VenueCard/Details.
  const toggleFavorite = async (venueId) => {
    if (!user) return;
    const isFav = favoriteIds.includes(venueId);

    if (isFav) {
      setFavoriteIds((prev) => prev.filter((id) => id !== venueId));
      const { error } = await supabase.from('favorites').delete().eq('venue_id', venueId);
      if (error) setFavoriteIds((prev) => [...prev, venueId]); // revert on failure
    } else {
      setFavoriteIds((prev) => [...prev, venueId]);
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, venue_id: venueId });
      if (error) setFavoriteIds((prev) => prev.filter((id) => id !== venueId)); // revert on failure
    }
  };

  const isFavorite = (venueId) => favoriteIds.includes(venueId);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../utils/useLocalStorage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  // Guests can favorite too — kept locally until they have an account to
  // attach it to.
  const [guestFavorites, setGuestFavorites] = useLocalStorage('ballplan_guest_favorites', []);
  const [remoteFavorites, setRemoteFavorites] = useState([]);
  const prevUserRef = useRef(user);

  useEffect(() => {
    if (!user) {
      setRemoteFavorites([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('favorites')
      .select('venue_id')
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setRemoteFavorites(data.map((row) => row.venue_id));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // On the transition from guest to signed in, push whatever was favorited
  // as a guest into the account instead of leaving it stranded locally.
  useEffect(() => {
    const hadNoUser = !prevUserRef.current;
    prevUserRef.current = user;
    if (!hadNoUser || !user || guestFavorites.length === 0) return;

    (async () => {
      const rows = guestFavorites.map((venueId) => ({ user_id: user.id, venue_id: venueId }));
      const { error } = await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,venue_id' });
      if (error) return;
      setGuestFavorites([]);
      const { data } = await supabase.from('favorites').select('venue_id');
      if (data) setRemoteFavorites(data.map((row) => row.venue_id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const favoriteIds = user ? remoteFavorites : guestFavorites;

  const toggleFavorite = async (venueId) => {
    if (!user) {
      setGuestFavorites((prev) =>
        prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId],
      );
      return;
    }

    const isFav = remoteFavorites.includes(venueId);
    if (isFav) {
      setRemoteFavorites((prev) => prev.filter((id) => id !== venueId));
      const { error } = await supabase.from('favorites').delete().eq('venue_id', venueId);
      if (error) setRemoteFavorites((prev) => [...prev, venueId]); // revert on failure
    } else {
      setRemoteFavorites((prev) => [...prev, venueId]);
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, venue_id: venueId });
      if (error) setRemoteFavorites((prev) => prev.filter((id) => id !== venueId)); // revert on failure
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

import { createContext, useContext } from 'react';
import { useLocalStorage } from '../utils/useLocalStorage';
import { getSeedReviews } from '../data/mockReviews';
import { getVenueById } from '../lib/venuesData';
import { useHiddenReviewIdsStore } from '../shared/store';

const ReviewsContext = createContext(null);

export function ReviewsProvider({ children }) {
  const [userReviews, setUserReviews] = useLocalStorage('ballplan_user_reviews', {});
  const hiddenIds = useHiddenReviewIdsStore();

  const getReviews = (venueId) => {
    const venue = getVenueById(venueId);
    const seeded = venue ? getSeedReviews(venue) : [];
    const mine = userReviews[venueId] || [];
    return [...mine, ...seeded]
      .filter((r) => !hiddenIds.includes(r.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const addReview = (venueId, { rating, text, name }) => {
    const review = {
      id: `user-${Date.now()}`,
      name: name || 'You',
      rating,
      text,
      date: new Date().toISOString(),
      seeded: false,
      isMine: true,
    };
    setUserReviews((prev) => ({ ...prev, [venueId]: [review, ...(prev[venueId] || [])] }));
    return review;
  };

  const deleteReview = (venueId, reviewId) => {
    setUserReviews((prev) => ({
      ...prev,
      [venueId]: (prev[venueId] || []).filter((r) => r.id !== reviewId),
    }));
  };

  const getSummary = (venueId) => {
    const reviews = getReviews(venueId);
    const count = reviews.length;
    const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { count, avg, distribution };
  };

  return (
    <ReviewsContext.Provider value={{ getReviews, addReview, deleteReview, getSummary }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}

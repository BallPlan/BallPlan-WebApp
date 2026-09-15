import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, Phone, MapPin, Clock, Play, ChevronDown, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { useVenuesStore, getVenueById, usePriceOverridesStore, getEffectivePrice } from '../shared/store';
import ImageWithFallback from '../components/ImageWithFallback';
import BackButton from '../components/BackButton';
import Lightbox from '../components/Lightbox';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemModal from '../components/MenuItemModal';
import ReportPriceModal from '../components/ReportPriceModal';
import RatingStars from '../components/RatingStars';
import RatingDistribution from '../components/RatingDistribution';
import ReviewCard from '../components/ReviewCard';
import WriteReviewModal from '../components/WriteReviewModal';
import { formatNaira } from '../utils/currency';
import { isOpenNow } from '../utils/time';
import { openDirections } from '../utils/maps';
import { getVenueCoords, osmEmbedUrl, osmViewUrl } from '../utils/geo';
import { useFavorites } from '../context/FavoritesContext';
import { useBudgetAwareCart } from '../utils/useBudgetAwareCart';
import { useToast } from '../context/ToastContext';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const venuesSnapshot = useVenuesStore();
  const overridesSnapshot = usePriceOverridesStore();
  const venue = useMemo(() => getVenueById(id), [id, venuesSnapshot]);

  const [tab, setTab] = useState('Menu');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [reportItem, setReportItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [feesOpen, setFeesOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCart, addWithinBudget } = useBudgetAwareCart();
  const { notify } = useToast();
  const { getReviews, getSummary, deleteReview } = useReviews();
  const { user } = useAuth();

  const handleToggleFavorite = () => {
    if (!user) {
      notify('Sign in to save favorites.', 'warning');
      navigate('/signin');
      return;
    }
    toggleFavorite(venue.id);
  };

  const tabs = useMemo(() => {
    const list = [];
    if (venue?.hasMenu) list.push('Menu');
    if (venue?.hasActivities) list.push('Activities');
    list.push('Reviews', 'Photos', 'Location');
    return list;
  }, [venue]);

  if (!venue) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-ink dark:text-white">Venue not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand hover:underline">
          Back to home
        </button>
      </div>
    );
  }

  const open = isOpenNow(venue.openTime, venue.closeTime);
  const favorited = isFavorite(venue.id);
  const coords = getVenueCoords(venue);
  const reviews = getReviews(venue.id);
  const reviewSummary = getSummary(venue.id);
  const withLivePrice = (item) => ({ ...item, price: getEffectivePrice(venue.id, item.id, item.price) });
  void overridesSnapshot; // re-render this component whenever any price override changes

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-ink/5 dark:bg-white/5">
        <div className="relative aspect-[16/10] sm:aspect-[16/8]">
          <ImageWithFallback
            src={venue.hero}
            seed={venue.id}
            alt={venue.name}
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => setLightboxIndex(0)}
          />
          <BackButton className="absolute left-4 top-4 bg-white/90 text-ink/70 shadow-md backdrop-blur dark:bg-white/90 dark:text-ink/70" />
          {venue.hasVideo && (
            <button
              onClick={() =>
                notify(`Playing a walkthrough video of ${venue.name}...`, 'info')
              }
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/35"
              aria-label="Play video"
            >
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" />
              <Play size={26} className="relative fill-white" />
            </button>
          )}
          <button
            onClick={handleToggleFavorite}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-110"
            aria-label="Toggle favorite"
          >
            <Heart size={18} className={favorited ? 'fill-brand text-brand' : 'text-ink/70'} />
          </button>
        </div>

        {venue.gallery.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
            {venue.gallery.slice(0, 4).map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-white/70 shadow-md transition hover:scale-105 sm:h-20 sm:w-28"
              >
                <ImageWithFallback src={src} seed={`${venue.id}-${i}`} alt="" className="h-full w-full object-cover" />
                {i === 3 && venue.gallery.length > 4 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                    +{venue.gallery.length - 3}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={open ? 'text-emerald-600' : 'text-red-500'}>{open ? 'Open' : 'Closed'}</span>
            <span className="text-ink/20 dark:text-white/20">|</span>
            <span className="text-ink/50 dark:text-white/50">Close at {venue.closeTime}</span>
          </div>
          <h1 className="font-display mt-1 text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">{venue.name}</h1>
          <p className="mt-2 text-ink/55 dark:text-white/55">
            {venue.category} | {venue.location}
          </p>

          <h3 className="mt-5 text-sm font-bold text-ink dark:text-white">Description</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/60 dark:text-white/60">{venue.description}</p>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-ink/50 dark:text-white/50">from</span>
            <span className="text-2xl font-extrabold text-brand">{formatNaira(venue.fromPrice)}</span>
          </div>

          {venue.hiddenFees?.length > 0 && (
            <div className="mt-3 max-w-md">
              <button
                onClick={() => setFeesOpen((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-ink/45 transition hover:text-brand dark:text-white/45"
              >
                Additional fees may apply at venue
                <ChevronDown size={13} className={`transition-transform ${feesOpen ? 'rotate-180' : ''}`} />
              </button>
              {feesOpen && (
                <ul className="mt-2 space-y-1 rounded-xl bg-white p-3 text-xs text-ink/55 shadow-card dark:bg-[#1c1c1e] dark:text-white/55">
                  {venue.hiddenFees.map((f) => (
                    <li key={f.label} className="flex justify-between">
                      <span>{f.label}</span>
                      <span className="font-semibold text-ink dark:text-white">{formatNaira(f.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setTab('Reviews')}
          className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left shadow-card transition hover:shadow-card-hover dark:bg-[#1c1c1e] lg:flex-col lg:items-end lg:bg-transparent lg:p-0 lg:shadow-none"
        >
          <div className="flex items-center gap-1.5 text-lg font-bold text-ink dark:text-white">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            {venue.rating.toFixed(1)}
            {reviewSummary.count > 0 && (
              <span className="text-sm font-medium text-ink/40 dark:text-white/40">({reviewSummary.count})</span>
            )}
          </div>
          <span className="text-xs text-ink/40 dark:text-white/40 lg:hidden">{venue.distanceKm} km away</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-6 overflow-x-auto border-b border-ink/10 dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 pb-3 text-sm font-semibold transition-colors ${
              tab === t
                ? 'text-ink dark:text-white'
                : 'text-ink/40 hover:text-ink/70 dark:text-white/40 dark:hover:text-white/70'
            }`}
          >
            {t}
            {tab === t && (
              <motion.span layoutId="details-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-brand dark:bg-brand" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Menu' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {venue.menu.map((raw) => {
              const item = withLivePrice(raw);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  inCart={isInCart(venue.id, item.id)}
                  onAdd={() => addWithinBudget(venue, item, 'menu')}
                  onReport={() => setReportItem(item)}
                  onViewDetails={() => setDetailItem(item)}
                />
              );
            })}
          </div>
        )}

        {tab === 'Activities' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {venue.activities.map((raw) => {
              const item = withLivePrice(raw);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  inCart={isInCart(venue.id, item.id)}
                  onAdd={() => addWithinBudget(venue, item, 'activity')}
                  onReport={() => setReportItem(item)}
                  onViewDetails={() => setDetailItem(item)}
                />
              );
            })}
          </div>
        )}

        {tab === 'Reviews' && (
          <div className="max-w-2xl">
            <div className="flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1c1c1e] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-ink dark:text-white">{reviewSummary.avg.toFixed(1)}</p>
                  <RatingStars rating={reviewSummary.avg} size={14} className="mt-1 justify-center" />
                  <p className="mt-1 text-xs text-ink/40 dark:text-white/40">
                    {reviewSummary.count} review{reviewSummary.count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="w-40">
                  <RatingDistribution distribution={reviewSummary.distribution} total={reviewSummary.count} />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setReviewModalOpen(true)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
              >
                <MessageSquarePlus size={16} /> Write a review
              </motion.button>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-[#1c1c1e]">
              {reviews.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink/40 dark:text-white/40">No reviews yet — be the first to share your experience.</p>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onDelete={review.isMine ? () => deleteReview(venue.id, review.id) : null}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'Photos' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {venue.gallery.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square overflow-hidden rounded-xl shadow-card transition hover:opacity-90"
              >
                <ImageWithFallback src={src} seed={`${venue.id}-p-${i}`} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {tab === 'Location' && (
          <div className="max-w-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-ink dark:text-white">Direction</h3>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openDirections(venue.address)}
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Direction
              </motion.button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 shadow-card dark:border-white/10">
              <iframe
                title={`Map showing ${venue.name}`}
                src={osmEmbedUrl(coords)}
                loading="lazy"
                className="h-56 w-full sm:h-64"
                style={{ border: 0 }}
              />
              <a
                href={osmViewUrl(coords)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-white py-2.5 text-xs font-semibold text-brand transition hover:bg-cream dark:bg-[#1c1c1e] dark:hover:bg-white/10"
              >
                View larger map <ExternalLink size={12} />
              </a>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card dark:bg-[#1c1c1e]">
              <ImageWithFallback src={venue.hero} seed={venue.id} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-bold text-ink dark:text-white">{venue.name}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">{venue.phone}</p>
              </div>
              <a
                href={`tel:${venue.phone.replace(/[^+\d]/g, '')}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
                aria-label="Call venue"
              >
                <Phone size={17} />
              </a>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/40 dark:text-white/40">Restaurant Address</p>
                  <p className="text-sm font-medium text-ink dark:text-white">{venue.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Clock size={16} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/40 dark:text-white/40">Close Time</p>
                  <p className="text-sm font-medium text-ink dark:text-white">{venue.closeTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Lightbox
        images={venue.gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
      <ReportPriceModal item={reportItem} venue={venue} onClose={() => setReportItem(null)} />
      <MenuItemModal
        item={detailItem}
        inCart={detailItem ? isInCart(venue.id, detailItem.id) : false}
        onAdd={() =>
          detailItem &&
          addWithinBudget(venue, detailItem, venue.menu.some((m) => m.id === detailItem.id) ? 'menu' : 'activity')
        }
        onReport={() => {
          setReportItem(detailItem);
          setDetailItem(null);
        }}
        onClose={() => setDetailItem(null)}
      />
      <WriteReviewModal venue={venue} open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} />
    </div>
  );
}

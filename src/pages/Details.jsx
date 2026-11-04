import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, Phone, MapPin, Clock, Play, ChevronDown, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { useVenuesStore, getVenueById } from '../lib/venuesData';
import { supabase } from '../lib/supabaseClient';
import BackButton from '../components/BackButton';
import Lightbox from '../components/Lightbox';
import VenueGallery from '../components/VenueGallery';
import MediaView from '../components/MediaView';
import { isVideoUrl } from '../utils/uploadMedia';
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
import { useReviews } from '../context/ReviewsContext';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const venuesSnapshot = useVenuesStore();
  const venue = useMemo(() => getVenueById(id), [id, venuesSnapshot]);

  // Fire-and-forget: powers the agent dashboard's views count/chart. Not
  // awaited or surfaced to the user — a failure here shouldn't affect
  // browsing.
  useEffect(() => {
    if (id) supabase.rpc('record_venue_view', { p_venue_id: id }).then();
  }, [id]);

  // Default to whichever of Menu/Activities the venue actually has — a venue
  // with only activities (no menu) left `tab` stuck on 'Menu', which isn't
  // in its `tabs` list below, so nothing matched and the page looked empty
  // until the user clicked a tab themselves. venue is sometimes still
  // undefined on the very first render (e.g. a direct link to /details/:id,
  // loaded before venuesData's initial fetch resolves), so a plain lazy
  // initializer alone isn't enough — the effect below applies the same
  // default once venue data actually arrives, but only if the user hasn't
  // already picked a tab themselves by then.
  const autoSelectedTab = useRef(false);
  const [tab, setTab] = useState(() => {
    if (venue?.hasMenu) return 'Menu';
    if (venue?.hasActivities) return 'Activities';
    return 'Reviews';
  });

  useEffect(() => {
    if (autoSelectedTab.current || !venue) return;
    autoSelectedTab.current = true;
    if (venue.hasMenu) setTab('Menu');
    else if (venue.hasActivities) setTab('Activities');
  }, [venue]);

  const selectTab = (t) => {
    autoSelectedTab.current = true;
    setTab(t);
  };
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [menuSection, setMenuSection] = useState(null); // 'food' | 'drink'; null = auto
  useEffect(() => setMenuSection(null), [id]);
  const [reportItem, setReportItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [feesOpen, setFeesOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { items: cartItems, updateQty, addWithinBudget } = useBudgetAwareCart();
  const qtyInPlan = (itemId) => cartItems.find((i) => i.venueId === id && i.itemId === itemId)?.qty || 0;
  // First add shows the "Added to your plan" toast; + on the stepper is quiet.
  const addToPlan = (item, kind) => addWithinBudget(venue, item, kind, { quiet: qtyInPlan(item.id) > 0 });
  const removeOneFromPlan = (item) => updateQty(`${venue.id}:${item.id}`, qtyInPlan(item.id) - 1);
  const { getReviews, getSummary, deleteReview } = useReviews();

  const handleToggleFavorite = () => {
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
  // Hero first, then the gallery, without repeats — one list drives the
  // slideshow, the Photos tab and the full-screen viewer so their indexes match.
  const media = [...new Set([venue.hero, ...(venue.gallery || [])].filter(Boolean))];
  const foodItems = venue.menu.filter((m) => (m.menuType || 'food') === 'food');
  const drinkItems = venue.menu.filter((m) => m.menuType === 'drink');
  // Default to Food, or Drinks when the venue only has drinks.
  const menuType = menuSection || (foodItems.length === 0 && drinkItems.length > 0 ? 'drink' : 'food');
  const menuItems = menuType === 'drink' ? drinkItems : foodItems;

  return (
    <div>
      {/* Hero */}
      <VenueGallery
        media={media}
        venueId={venue.id}
        alt={venue.name}
        paused={lightboxIndex != null}
        onOpen={setLightboxIndex}
        overlay={
          <>
            <BackButton className="absolute left-4 top-4 z-10 bg-white/90 text-ink/70 shadow-md backdrop-blur dark:bg-white/90 dark:text-ink/70" />
            <button
              onClick={handleToggleFavorite}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-110"
              aria-label="Toggle favorite"
            >
              <Heart size={18} className={favorited ? 'fill-brand text-brand' : 'text-ink/70'} />
            </button>
          </>
        }
      />

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
          onClick={() => selectTab('Reviews')}
          className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left shadow-card transition hover:shadow-card-hover dark:bg-[#1c1c1e] lg:flex-col lg:items-end lg:bg-transparent lg:p-0 lg:shadow-none"
        >
          <div className="flex items-center gap-1.5 text-lg font-bold text-ink dark:text-white">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            {venue.rating.toFixed(1)}
            {reviewSummary.count > 0 && (
              <span className="text-sm font-medium text-ink/40 dark:text-white/40">({reviewSummary.count})</span>
            )}
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-6 overflow-x-auto border-b border-ink/10 dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
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
          <div>
            <div className="mb-4 flex gap-2">
              {[
                ['food', 'Food', foodItems.length],
                ['drink', 'Drinks', drinkItems.length],
              ].map(([type, label, n]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMenuSection(type)}
                  aria-pressed={menuType === type}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    menuType === type
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-white text-ink/60 shadow-card hover:text-ink dark:bg-[#1c1c1e] dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  {label} <span className={menuType === type ? 'text-white/70' : 'text-ink/35 dark:text-white/35'}>({n})</span>
                </button>
              ))}
            </div>
            {menuItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink/40 dark:text-white/40">
                No {menuType === 'drink' ? 'drinks' : 'food'} on this menu yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {menuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    qty={qtyInPlan(item.id)}
                    onAdd={() => addToPlan(item, 'menu')}
                    onDecrement={() => removeOneFromPlan(item)}
                    onReport={() => setReportItem(item)}
                    onViewDetails={() => setDetailItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Activities' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {venue.activities.map((item) => {
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  qty={qtyInPlan(item.id)}
                  onAdd={() => addToPlan(item, 'activity')}
                  onDecrement={() => removeOneFromPlan(item)}
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
            {media.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-square overflow-hidden rounded-xl shadow-card transition hover:opacity-90"
              >
                <MediaView src={src} seed={`${venue.id}-p-${i}`} alt="" className="h-full w-full object-cover" />
                {isVideoUrl(src) && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                    <Play size={22} className="fill-white" />
                  </span>
                )}
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
              <MediaView src={venue.hero} seed={venue.id} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-bold text-ink dark:text-white">{venue.name}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">{venue.phone || 'No phone number on file'}</p>
              </div>
              {venue.phone && (
                <a
                  href={`tel:${venue.phone.replace(/[^+\d]/g, '')}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
                  aria-label="Call venue"
                >
                  <Phone size={17} />
                </a>
              )}
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
        images={media}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
      <ReportPriceModal item={reportItem} venue={venue} onClose={() => setReportItem(null)} />
      <MenuItemModal
        item={detailItem}
        qty={detailItem ? qtyInPlan(detailItem.id) : 0}
        onAdd={() =>
          detailItem && addToPlan(detailItem, venue.menu.some((m) => m.id === detailItem.id) ? 'menu' : 'activity')
        }
        onDecrement={() => detailItem && removeOneFromPlan(detailItem)}
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

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Download, ShoppingBag, UtensilsCrossed, Ticket, MapPin, Sparkles, Play, Loader2, Info } from 'lucide-react';
import { getPublishedVenues, useVenuesStore } from '../lib/venuesData';
import ImageWithFallback from '../components/ImageWithFallback';
import Lightbox from '../components/Lightbox';
import QuantityStepper from '../components/QuantityStepper';
import BackButton from '../components/BackButton';
import { formatNaira } from '../utils/currency';
import { openDirections } from '../utils/maps';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { downloadPlanPdf } from '../utils/generatePlanPdf';
import { reportPlanDownloaded } from '../lib/analytics';

// Returns { matches, tier } — tier tells the UI whether these results
// actually satisfy what the user asked for, or are a fallback, so the page
// can be honest about it instead of always claiming a "match". When the
// budget doesn't fit anything, category/location take priority over price —
// we fall back to venues that still match what was picked, ranked by how
// close their price is to the stated budget (not just the cheapest ones).
function pickMatches({ max, location, category }, venues) {
  const categories = [].concat(category || []).filter(Boolean);
  const locations = [].concat(location || []).filter(Boolean);

  const matchesPreferences = (v) => {
    if (categories.length && !categories.includes(v.tab)) return false;
    if (locations.length && !locations.some((loc) => v.location.toLowerCase().includes(loc.toLowerCase()))) return false;
    return true;
  };
  const byClosenessToBudget = (a, b) => Math.abs(a.fromPrice - max) - Math.abs(b.fromPrice - max);

  const exact = venues.filter((v) => v.fromPrice <= max && matchesPreferences(v));
  if (exact.length) return { matches: exact.slice(0, 6), tier: 'exact' };

  const preferenceOnly = venues.filter(matchesPreferences).sort(byClosenessToBudget).slice(0, 6);
  if (preferenceOnly.length) return { matches: preferenceOnly, tier: 'preference' };

  const closest = [...venues].sort(byClosenessToBudget).slice(0, 4);
  return { matches: closest, tier: 'suggestions' };
}

function buildSelection(venue) {
  return {
    menu: venue.menu.length ? venue.menu.slice(0, 2).map((item) => ({ itemId: item.id, qty: 2 })) : [],
    activities: venue.activities.length
      ? venue.activities.slice(0, 2).map((item) => ({ itemId: item.id, qty: 1 }))
      : [],
  };
}

export default function PlanResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const [downloading, setDownloading] = useState(false);
  const venuesSnapshot = useVenuesStore();

  const params = location.state;

  const { matches, tier } = useMemo(
    () => (params ? pickMatches(params, getPublishedVenues()) : { matches: [], tier: 'exact' }),
    [params, venuesSnapshot],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!params) {
      navigate('/plan-outing/ballplan', { replace: true });
    }
  }, [params, navigate]);

  useEffect(() => {
    const init = {};
    matches.forEach((venue) => {
      init[venue.id] = buildSelection(venue);
    });
    setSelections(init);
    setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length]);

  useEffect(() => {
    setLightboxIndex(null);
  }, [pageIndex]);

  if (!params) return null;

  if (matches.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-ink dark:text-white">No places matched your budget.</p>
        <button onClick={() => navigate('/plan-outing/ballplan')} className="mt-4 text-brand hover:underline">
          Try a different budget
        </button>
      </div>
    );
  }

  const venue = matches[pageIndex];
  const venueSelection = selections[venue.id] || { menu: [], activities: [] };

  const updateQty = (kind, itemId, qty) => {
    setSelections((prev) => ({
      ...prev,
      [venue.id]: {
        ...prev[venue.id],
        [kind]: prev[venue.id][kind].map((s) => (s.itemId === itemId ? { ...s, qty } : s)),
      },
    }));
  };

  const resolveItems = (kind) => {
    const pool = kind === 'menu' ? venue.menu : venue.activities;
    return venueSelection[kind]
      .map((s) => {
        const found = pool.find((p) => p.id === s.itemId);
        if (!found) return null;
        return { ...found, qty: s.qty, kind };
      })
      .filter((i) => i && i.qty > 0);
  };

  const selectedMenu = resolveItems('menu');
  const selectedActivities = resolveItems('activities');
  const allSelected = [...selectedMenu, ...selectedActivities];

  const total = allSelected.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItemsCount = allSelected.reduce((sum, i) => sum + i.qty, 0);
  const savings = params.max - total;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const sections = [
        {
          key: venue.name,
          items: allSelected.map((item) => ({
            name: item.name,
            venueId: venue.id,
            venueName: venue.name,
            location: venue.location,
            address: venue.address,
            phone: venue.phone,
            image: item.image,
            unitPrice: item.price,
            qty: item.qty,
            kind: item.kind,
          })),
          subtotal: total,
          count: totalItemsCount,
        },
      ];
      await downloadPlanPdf({
        sections,
        groupLabel: 'Venue',
        totalItems: totalItemsCount,
        totalPrice: total,
        preparedFor: user?.email,
        budget: params.max,
      });
      console.log('[plan-result] downloaded PDF plan for', venue.name);
      reportPlanDownloaded({ venues: 1, items: totalItemsCount, total });
      notify('Your plan has been downloaded.', 'success');
    } catch (err) {
      console.error('[plan-result] failed to generate PDF', err);
      notify('Could not generate your PDF. Please try again.', 'warning');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddToCart = () => {
    allSelected.forEach((item) => {
      for (let i = 0; i < item.qty; i += 1) addItem(venue, item, item.kind === 'menu' ? 'menu' : 'activity');
    });
    notify(`Added ${venue.name} to your plan.`, 'success');
  };

  const headline =
    tier === 'exact'
      ? `We found ${matches.length} place${matches.length > 1 ? 's' : ''} matching your budget.`
      : "We couldn't find a match for what you're looking for.";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-2">
        <BackButton />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Sparkles size={16} />
        </span>
        <h1 className="font-display text-lg font-bold text-ink dark:text-white sm:text-xl">{headline}</h1>
      </div>

      {tier !== 'exact' && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>
            {tier === 'preference'
              ? "Nothing fit your budget exactly, so here are places in your chosen category and location closest to it instead."
              : "Nothing matched your budget or preferences, so here are our closest suggestions instead — they may not fit what you asked for."}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={venue.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-3xl bg-white shadow-card-hover ring-1 ring-ink/5 dark:bg-[#1c1c1e] dark:ring-white/10"
        >
          <div className="relative">
            <div className="aspect-[16/9] cursor-pointer" onClick={() => setLightboxIndex(0)}>
              <ImageWithFallback src={venue.hero} seed={venue.id} alt={venue.name} className="h-full w-full object-cover" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />

            {venue.hasVideo && (
              <button
                onClick={() => notify(`Playing a walkthrough video of ${venue.name}...`, 'info')}
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/35"
                aria-label="Play video"
              >
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" />
                <Play size={22} className="relative fill-white" />
              </button>
            )}

            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow backdrop-blur">
              {venue.category}
            </span>
            <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow backdrop-blur">
              <Star size={13} className="fill-amber-400 text-amber-400" /> {venue.rating.toFixed(1)}
            </span>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
              <h2 className="font-display text-2xl font-extrabold text-white drop-shadow-sm">{venue.name}</h2>
              <p className="flex items-center gap-1 text-sm text-white/85">
                <MapPin size={13} /> {venue.location}
              </p>
            </div>

            {venue.gallery.length > 1 && (
              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {venue.gallery.slice(0, 4).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 border-white/80 shadow transition hover:scale-110"
                  >
                    <ImageWithFallback src={src} seed={`${venue.id}-${i}`} alt="" className="h-full w-full object-cover" />
                    {i === 3 && venue.gallery.length > 4 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-bold text-white">
                        +{venue.gallery.length - 3}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-ink/55 dark:text-white/55">{venue.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => openDirections(venue.address)}
                className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
              >
                Direction
              </button>
              <span className="text-sm text-ink/50 dark:text-white/50">
                from <span className="font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
              </span>
            </div>

            {selectedMenu.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <UtensilsCrossed size={14} />
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-white/50">Menu Picks</h3>
                </div>
                <div className="space-y-3">
                  {selectedMenu.map((item) => (
                    <ItemRow key={item.id} item={item} onChangeQty={(qty) => updateQty('menu', item.id, qty)} />
                  ))}
                </div>
              </div>
            )}

            {selectedActivities.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Ticket size={14} />
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-white/50">Activities Picks</h3>
                </div>
                <div className="space-y-3">
                  {selectedActivities.map((item) => (
                    <ItemRow key={item.id} item={item} onChangeQty={(qty) => updateQty('activities', item.id, qty)} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2.5 border-t border-ink/10 pt-5 dark:border-white/10">
              <StatPill label="Total" value={formatNaira(total)} tone="brand" />
              <StatPill label="Budget" value={formatNaira(params.max)} tone="ink" />
              <StatPill
                label={savings >= 0 ? 'Savings' : 'Over budget'}
                value={formatNaira(Math.abs(savings))}
                tone={savings >= 0 ? 'green' : 'red'}
              />
            </div>
            <p className="mt-2 text-center text-xs text-ink/35 dark:text-white/35">
              {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'} selected · prices are 90% accurate
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-brand py-3.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
              >
                <ShoppingBag size={16} /> Add to My Plan
              </motion.button>
              <motion.button
                whileHover={{ scale: downloading ? 1 : 1.02 }}
                whileTap={{ scale: downloading ? 1 : 0.98 }}
                onClick={handleDownload}
                disabled={downloading}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-3.5 text-sm font-bold text-white shadow-soft transition hover:brightness-105 disabled:opacity-70"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparing...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {matches.length > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {matches.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setPageIndex(i)}
              title={m.name}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition ${
                i === pageIndex
                  ? 'scale-105 bg-gradient-to-br from-brand to-brand-dark text-white shadow-soft'
                  : 'bg-white text-ink/50 shadow-card hover:text-ink dark:bg-[#1c1c1e] dark:text-white/50 dark:hover:text-white'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Lightbox
        images={venue.gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
}

function ItemRow({ item, onChangeQty }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-gradient-to-r from-cream/60 to-transparent p-3 transition-shadow hover:shadow-card dark:border-white/10 dark:from-white/5"
    >
      <ImageWithFallback src={item.image} seed={item.id} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink dark:text-white">{item.name}</p>
        <QuantityStepper value={item.qty} onChange={onChangeQty} min={0} size="sm" />
      </div>
      <span className="shrink-0 font-bold text-brand">{formatNaira(item.price * item.qty)}</span>
    </motion.div>
  );
}

const TONES = {
  brand: 'bg-brand/10 text-brand',
  ink: 'bg-ink/5 text-ink dark:bg-white/10 dark:text-white',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  red: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400',
};

function StatPill({ label, value, tone }) {
  return (
    <div className={`rounded-2xl px-3 py-3 text-center ${TONES[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 truncate text-sm font-extrabold sm:text-base">{value}</p>
    </div>
  );
}

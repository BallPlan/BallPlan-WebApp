import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Download, ShoppingBag, UtensilsCrossed, Ticket, MapPin, Sparkles, Play } from 'lucide-react';
import { getPublishedVenues, useVenuesStore, usePriceOverridesStore, getEffectivePrice } from '../shared/store';
import ImageWithFallback from '../components/ImageWithFallback';
import Lightbox from '../components/Lightbox';
import QuantityStepper from '../components/QuantityStepper';
import BackButton from '../components/BackButton';
import { formatNaira } from '../utils/currency';
import { openDirections } from '../utils/maps';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

function pickMatches({ min, max, location, category }, venues) {
  const categories = [].concat(category || []).filter(Boolean);
  const locations = [].concat(location || []).filter(Boolean);

  let matches = venues.filter((v) => v.fromPrice <= max);
  if (categories.length) matches = matches.filter((v) => categories.includes(v.tab));
  if (locations.length) {
    matches = matches.filter((v) => locations.some((loc) => v.location.toLowerCase().includes(loc.toLowerCase())));
  }

  if (matches.length === 0) matches = venues.filter((v) => v.fromPrice <= max);
  if (matches.length === 0) matches = [...venues].sort((a, b) => a.fromPrice - b.fromPrice).slice(0, 4);

  return matches.slice(0, 6);
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
  const { notify } = useToast();
  const venuesSnapshot = useVenuesStore();
  const overridesSnapshot = usePriceOverridesStore();

  const params = location.state;

  const matches = useMemo(
    () => (params ? pickMatches(params, getPublishedVenues()) : []),
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
  void overridesSnapshot; // re-render whenever an admin-approved price override changes

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
        return { ...found, price: getEffectivePrice(venue.id, found.id, found.price), qty: s.qty, kind };
      })
      .filter((i) => i && i.qty > 0);
  };

  const selectedMenu = resolveItems('menu');
  const selectedActivities = resolveItems('activities');
  const allSelected = [...selectedMenu, ...selectedActivities];

  const total = allSelected.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItemsCount = allSelected.reduce((sum, i) => sum + i.qty, 0);
  const savings = params.max - total;

  const handleDownload = () => {
    const lines = [
      `BallPlan Plan — ${venue.name}`,
      venue.address,
      '',
      ...(selectedMenu.length ? ['MENU', ...selectedMenu.map((i) => `${i.name} x${i.qty} — ${formatNaira(i.price * i.qty)}`), ''] : []),
      ...(selectedActivities.length
        ? ['ACTIVITIES', ...selectedActivities.map((i) => `${i.name} x${i.qty} — ${formatNaira(i.price * i.qty)}`), '']
        : []),
      `Estimated Total: ${formatNaira(total)}`,
      `Budget: ${formatNaira(params.max)}`,
      `${savings >= 0 ? 'Savings' : 'Over budget'}: ${formatNaira(Math.abs(savings))}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballplan-plan-${venue.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log('[plan-result] downloaded plan for', venue.name);
    notify('Your plan has been downloaded.', 'success');
  };

  const handleAddToCart = () => {
    allSelected.forEach((item) => {
      for (let i = 0; i < item.qty; i += 1) addItem(venue, item, item.kind === 'menu' ? 'menu' : 'activity');
    });
    notify(`Added ${venue.name}'s plan to your cart.`, 'success');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-2">
        <BackButton />
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Sparkles size={16} />
        </span>
        <h1 className="font-display text-lg font-bold text-ink dark:text-white sm:text-xl">
          We found {matches.length} Place{matches.length > 1 ? 's' : ''} matching your budget.
        </h1>
      </div>

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
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink py-3.5 text-sm font-bold text-ink transition hover:bg-ink hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-ink"
              >
                <ShoppingBag size={16} /> Add to Cart
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark py-3.5 text-sm font-bold text-white shadow-soft transition hover:brightness-105"
              >
                <Download size={16} /> Download
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

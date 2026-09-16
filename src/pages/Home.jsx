import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, X } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import VenueCard from '../components/VenueCard';
import { useVenuesStore, getPublishedVenues } from '../lib/venuesData';
import { formatNaira } from '../utils/currency';
import { useBudget } from '../context/BudgetContext';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [tab, setTab] = useState('All');
  const { budget, budgetActive, clearBudget } = useBudget();
  const { totalPrice } = useCart();

  const venuesSnapshot = useVenuesStore(); // subscribe so publish/edit/delete in admin re-renders this page live
  const allVenues = useMemo(() => getPublishedVenues(), [venuesSnapshot]);

  const venues = useMemo(() => {
    if (tab === 'All') return allVenues;
    return allVenues.filter((v) => v.tab === tab);
  }, [allVenues, tab]);

  const remaining = budget != null ? budget - totalPrice : null;

  return (
    <div>
      {budgetActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand px-5 py-4 text-white"
        >
          <div className="flex items-center gap-3">
            <Wallet size={20} className="text-white" />
            <div>
              <p className="text-xs text-white/60">Planning with a budget of {formatNaira(budget)}</p>
              <p className="text-sm font-semibold">
                {remaining >= 0 ? `${formatNaira(remaining)} remaining` : `${formatNaira(Math.abs(remaining))} over budget`}
              </p>
            </div>
          </div>
          <button
            onClick={clearBudget}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
          >
            <X size={13} /> Clear budget
          </button>
        </motion.div>
      )}

      <CategoryTabs active={tab} onChange={setTab} />

      <div className="mt-6 mb-6">
        <p className="text-sm font-semibold text-brand">Curated for you</p>
        <h1 className="font-display mt-1 text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">What are you in the mood for?</h1>
      </div>

      {venues.length === 0 ? (
        <p className="py-16 text-center text-ink/50 dark:text-white/50">No places found in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {venues.map((venue, i) => (
            <VenueCard venue={venue} key={venue.id} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { X, Flag, Check, ChefHat, ShieldCheck } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import Sparkline from './Sparkline';
import PriceTrendBadge from './PriceTrendBadge';
import { formatNaira } from '../utils/currency';
import { getPriceHistory } from '../utils/priceHistory';

export default function MenuItemModal({ item, inCart, onAdd, onReport, onClose }) {
  if (!item) return null;

  const { points, trend, changePct, daysAgo, verifiedCount } = getPriceHistory(item);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-card-hover dark:bg-[#1c1c1e] sm:rounded-3xl"
        >
          <div className="relative aspect-[4/3]">
            <ImageWithFallback src={item.image} seed={item.id} alt={item.name} className="h-full w-full object-cover" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:scale-110"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-extrabold text-ink dark:text-white">{item.name}</h3>
              <span className="shrink-0 text-lg font-extrabold text-brand">{formatNaira(item.price)}</span>
            </div>

            {item.desc && (
              <div className="mt-4 flex gap-2.5 rounded-2xl bg-cream p-4 dark:bg-white/5">
                <ChefHat size={18} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">What's in it</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/65 dark:text-white/65">{item.desc}</p>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Price history · 6 weeks</p>
                <PriceTrendBadge trend={trend} changePct={changePct} />
              </div>
              <div className="mt-3">
                <Sparkline points={points} trend={trend} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/45 dark:text-white/45">
                <ShieldCheck size={13} className="text-brand" />
                Verified by {verifiedCount} people · last checked {daysAgo}d ago
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold shadow-soft transition ${
                  inCart ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-dark'
                }`}
              >
                {inCart ? (
                  <>
                    <Check size={16} /> Added to cart
                  </>
                ) : (
                  'Add to cart'
                )}
              </motion.button>
              <button
                onClick={onReport}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/40 transition hover:border-brand/40 hover:text-brand dark:border-white/10 dark:text-white/40"
                aria-label="Report incorrect price"
              >
                <Flag size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

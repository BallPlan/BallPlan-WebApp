import { motion } from 'framer-motion';
import { Flag, Check, Info, Plus } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import PriceTrendBadge from './PriceTrendBadge';
import { formatNaira } from '../utils/currency';
import { getPriceHistory } from '../utils/priceHistory';

// On phones (two-up grid) the price-change badge moves from beside the
// name to the image's top-left corner, and "Add to plan" becomes a round + button, so
// the name gets the full card width. From sm: up the layout is unchanged.
export default function MenuItemCard({ item, inCart, onAdd, onReport, onViewDetails }) {
  const { trend, changePct } = getPriceHistory(item);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onViewDetails}
      className="flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-card-hover dark:bg-[#1c1c1e]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={item.image}
          seed={item.id}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink/70 shadow-md backdrop-blur transition hover:scale-110 hover:text-brand"
          aria-label={`View details for ${item.name}`}
        >
          <Info size={14} />
        </button>
        {trend !== 'flat' && (
          <PriceTrendBadge trend={trend} changePct={changePct} onImage className="absolute left-2 top-2 sm:hidden" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3.5">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="line-clamp-2 text-[13px] font-bold leading-snug text-ink dark:text-white sm:line-clamp-none sm:text-sm sm:leading-tight">
            {item.name}
          </h4>
          {trend !== 'flat' && (
            <PriceTrendBadge trend={trend} changePct={changePct} className="hidden shrink-0 sm:inline-flex" />
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-brand">{formatNaira(item.price)}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            aria-label={inCart ? `${item.name} added to plan` : `Add ${item.name} to plan`}
            className={`flex h-8 w-8 shrink-0 items-center justify-center gap-1 rounded-full text-xs font-semibold shadow-sm transition sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 ${
              inCart ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            {inCart ? (
              <>
                <Check size={15} strokeWidth={2.5} className="sm:hidden" aria-hidden="true" />
                <Check size={13} className="hidden sm:block" aria-hidden="true" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <Plus size={17} strokeWidth={2.5} className="sm:hidden" aria-hidden="true" />
                <span className="hidden sm:inline">Add to plan</span>
              </>
            )}
          </motion.button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          className="flex items-center gap-1 whitespace-nowrap pt-1 text-[10px] font-medium text-ink/35 transition hover:text-brand dark:text-white/35 sm:text-[11px]"
        >
          <Flag size={11} className="shrink-0" /> Report Incorrect price
        </button>
      </div>
    </motion.div>
  );
}

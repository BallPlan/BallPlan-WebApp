import { motion } from 'framer-motion';
import { Flag, Info } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import PriceTrendBadge from './PriceTrendBadge';
import PlanQuantityButton from './PlanQuantityButton';
import { formatNaira } from '../utils/currency';
import { getPriceHistory } from '../utils/priceHistory';

// On phones (two-up grid) the price-change badge moves from beside the
// name to the image's top-left corner (so the name gets the full card
// width), and the Add to plan button / quantity stepper is full width
// under the price so it stays on one line. From sm: up the layout is unchanged.
export default function MenuItemCard({ item, qty = 0, onAdd, onDecrement, onReport, onViewDetails }) {
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
        <div className="mt-auto flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="text-sm font-bold text-brand">{formatNaira(item.price)}</span>
          <PlanQuantityButton
            qty={qty}
            itemName={item.name}
            onAdd={onAdd}
            onDecrement={onDecrement}
            className="w-full sm:w-28"
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          className="mx-auto mt-0.5 flex max-w-full items-center justify-center gap-1 whitespace-nowrap rounded-full border border-ink/12 px-2.5 py-1 text-[10px] font-semibold text-ink/50 transition hover:border-brand hover:bg-brand/5 hover:text-brand dark:border-white/15 dark:text-white/50 dark:hover:border-brand dark:hover:text-brand sm:text-[11px]"
        >
          <Flag size={11} className="shrink-0" /> Report <span className="hidden min-[360px]:inline">Incorrect</span> price
        </button>
      </div>
    </motion.div>
  );
}

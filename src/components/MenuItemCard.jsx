import { motion } from 'framer-motion';
import { Flag, Check, Info } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import PriceTrendBadge from './PriceTrendBadge';
import { formatNaira } from '../utils/currency';
import { getPriceHistory } from '../utils/priceHistory';

export default function MenuItemCard({ item, inCart, onAdd, onReport, onViewDetails }) {
  const { trend, changePct } = getPriceHistory(item);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onViewDetails}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-card-hover dark:bg-[#1c1c1e]"
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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="text-sm font-bold leading-tight text-ink dark:text-white">{item.name}</h4>
          {trend !== 'flat' && <PriceTrendBadge trend={trend} changePct={changePct} className="shrink-0" />}
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
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
              inCart ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            {inCart ? (
              <>
                <Check size={13} /> Added
              </>
            ) : (
              'Add to plan'
            )}
          </motion.button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          className="flex items-center gap-1 pt-1 text-[11px] font-medium text-ink/35 transition hover:text-brand dark:text-white/35"
        >
          <Flag size={11} /> Report Incorrect price
        </button>
      </div>
    </motion.div>
  );
}

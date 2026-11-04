import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';

// "Add to plan" until the item is in the plan, then a quantity stepper in
// the same spot: [− | qty | +]. At 1 the left button is a bin — tapping it
// takes the item out and the button goes back to "Add to plan".
// size 'sm' = menu/activity cards, 'lg' = the item pop-up.
const SIZES = {
  sm: { height: 'h-8', text: 'text-xs', btn: 'h-6 w-6', icon: 13, qty: 'text-sm', pad: 'p-1' },
  lg: { height: 'h-12', text: 'text-sm', btn: 'h-9 w-9', icon: 16, qty: 'text-base', pad: 'p-1.5' },
};

export default function PlanQuantityButton({ qty, itemName, onAdd, onDecrement, size = 'sm', className = '' }) {
  const s = SIZES[size];
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`relative ${s.height} ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {qty > 0 ? (
          <motion.div
            key="stepper"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            role="group"
            aria-label={`${itemName} in your plan`}
            className={`flex h-full w-full items-center justify-between gap-1 rounded-full border border-brand/25 bg-brand/10 ${s.pad} shadow-sm dark:border-brand/40 dark:bg-brand/20`}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={stop(onDecrement)}
              aria-label={qty === 1 ? `Remove ${itemName} from plan` : `Remove one ${itemName}`}
              className={`flex ${s.btn} shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition dark:bg-[#2a2a2d] ${
                qty === 1 ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15' : 'text-brand hover:bg-brand/5'
              }`}
            >
              {qty === 1 ? <Trash2 size={s.icon} strokeWidth={2.25} /> : <Minus size={s.icon} strokeWidth={2.75} />}
            </motion.button>

            <span className={`relative min-w-[1.5rem] overflow-hidden text-center ${s.qty} font-extrabold tabular-nums text-brand`} aria-live="polite">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={qty}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="inline-block"
                >
                  {qty}
                </motion.span>
              </AnimatePresence>
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={stop(onAdd)}
              aria-label={`Add one more ${itemName}`}
              className={`flex ${s.btn} shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-brand-dark`}
            >
              <Plus size={s.icon} strokeWidth={2.75} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="add"
            type="button"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            whileTap={{ scale: 0.95 }}
            onClick={stop(onAdd)}
            className={`flex h-full w-full items-center justify-center whitespace-nowrap rounded-full bg-brand px-3 ${s.text} font-bold text-white shadow-sm transition hover:bg-brand-dark`}
          >
            Add to plan
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

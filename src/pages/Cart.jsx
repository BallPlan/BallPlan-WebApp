import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, XCircle } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import QuantityStepper from '../components/QuantityStepper';
import EmptyCart from '../components/EmptyCart';
import BackButton from '../components/BackButton';
import { useCart } from '../context/CartContext';
import { useBudget } from '../context/BudgetContext';
import { formatNaira } from '../utils/currency';
import { useToast } from '../context/ToastContext';

export default function Cart() {
  const { items, updateQty, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { budget, budgetActive } = useBudget();
  const navigate = useNavigate();
  const { notify } = useToast();

  const handleClearCart = () => {
    clearCart();
    notify('Your cart has been cleared.', 'success');
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-ink/10 pb-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-display text-2xl font-extrabold text-ink dark:text-white">Your Carts</h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <XCircle size={14} /> Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                  className="flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-card dark:bg-[#1c1c1e] sm:p-4"
                >
                  <ImageWithFallback
                    src={item.image}
                    seed={item.key}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink dark:text-white">{item.name}</p>
                    <p className="mb-2 truncate text-xs text-ink/40 dark:text-white/40">{item.venueName}</p>
                    <QuantityStepper
                      value={item.qty}
                      onChange={(v) => updateQty(item.key, v)}
                      min={1}
                      size="sm"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="font-bold text-brand">{formatNaira(item.unitPrice * item.qty)}</span>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="text-ink/30 transition hover:scale-110 hover:text-red-500 dark:text-white/30"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="sticky bottom-24 mt-8 rounded-2xl border-t border-ink/10 bg-cream/95 pt-5 backdrop-blur dark:border-white/10 dark:bg-[#121212]/95 lg:static lg:bottom-0 lg:bg-transparent lg:pt-6">
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <p className="text-lg font-extrabold text-ink dark:text-white">Estimated Total - {totalItems} items</p>
                <p className="text-xs text-ink/40 dark:text-white/40">The prices are 90% accurate.</p>
              </div>
              <span className="text-2xl font-extrabold text-brand">{formatNaira(totalPrice)}</span>
            </div>

            {budgetActive && budget != null && (
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-ink/50 dark:text-white/50">Budget</span>
                <span className="font-semibold text-ink dark:text-white">{formatNaira(budget)}</span>
              </div>
            )}
            {budgetActive && budget != null && (
              <div className="flex justify-between text-sm">
                <span className="text-ink/50 dark:text-white/50">{totalPrice <= budget ? 'Savings' : 'Over budget'}</span>
                <span className={`font-semibold ${totalPrice <= budget ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatNaira(Math.abs(budget - totalPrice))}
                </span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/view-plan')}
              className="mt-4 w-full rounded-full bg-brand py-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
            >
              View your plan
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

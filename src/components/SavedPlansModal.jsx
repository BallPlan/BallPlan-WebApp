import { AnimatePresence, motion } from 'framer-motion';
import { X, Bookmark, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { formatNaira } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useSavedPlans } from '../context/SavedPlansContext';
import { useToast } from '../context/ToastContext';

export default function SavedPlansModal({ open, onClose }) {
  const { plans, loading, deletePlan } = useSavedPlans();
  const { loadItems } = useCart();
  const { notify } = useToast();

  const handleLoad = (plan) => {
    loadItems(plan.items);
    notify(`"${plan.name}" loaded into your cart.`, 'success');
    onClose();
  };

  const handleDelete = async (plan) => {
    await deletePlan(plan);
    notify('Saved plan deleted.', 'info');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-card-hover dark:bg-[#1c1c1e] sm:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-ink/8 p-5 dark:border-white/10">
            <div className="flex items-center gap-2 text-brand">
              <Bookmark size={18} />
              <h3 className="text-lg font-bold text-ink dark:text-white">Saved Plans</h3>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink/50 dark:text-white/50">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            )}

            {!loading && plans.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Bookmark size={36} className="text-ink/20 dark:text-white/20" />
                <p className="mt-3 text-sm text-ink/50 dark:text-white/50">You haven't saved any plans yet.</p>
              </div>
            )}

            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-ink/8 p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink dark:text-white">{plan.name}</p>
                      <p className="mt-0.5 text-xs text-ink/40 dark:text-white/40">
                        {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ·{' '}
                        {plan.item_count} item{plan.item_count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-brand">{formatNaira(plan.total_price)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleLoad(plan)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand/10 py-2 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
                    >
                      <FolderOpen size={13} /> Load into cart
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="flex items-center justify-center rounded-full border border-ink/10 px-3 text-ink/50 transition hover:border-red-300 hover:text-red-500 dark:border-white/10 dark:text-white/50"
                      aria-label="Delete plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

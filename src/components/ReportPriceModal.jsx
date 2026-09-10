import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Flag } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { integerInputProps } from '../utils/integerInput';
import { addReport } from '../shared/store';

export default function ReportPriceModal({ item, venue, onClose }) {
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    setPrice('');
    setNote('');
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) {
      notify('Enter a valid price before submitting.', 'warning');
      return;
    }
    addReport(venue, item, Number(price), note);
    notify(`Thanks! We'll review the price for "${item.name}".`, 'success');
    onClose();
  };

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
          className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-card-hover dark:bg-[#1c1c1e] sm:rounded-3xl"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2 text-brand">
              <Flag size={18} />
              <h3 className="text-lg font-bold text-ink dark:text-white">Report incorrect price</h3>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <p className="mb-4 text-sm text-ink/60 dark:text-white/60">
            Help keep BallPlan accurate. What's the correct current price for{' '}
            <span className="font-semibold text-ink dark:text-white">{item.name}</span>?
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50 dark:text-white/50">₦</span>
              <input
                autoFocus
                {...integerInputProps(price, setPrice)}
                placeholder={String(item.price)}
                className="w-full rounded-xl border border-ink/15 bg-cream py-3 pl-8 pr-4 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Anything else? (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g price changed on weekends"
                className="w-full resize-none rounded-xl border border-ink/15 bg-cream p-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
            >
              Submit correction
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Yes', danger = true, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-card-hover dark:bg-[#1a1b20]"
        >
          <span
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              danger ? 'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400' : 'bg-brand/10 text-brand'
            }`}
          >
            <AlertTriangle size={22} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink dark:text-white">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{description}</p>}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand hover:bg-brand-dark'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

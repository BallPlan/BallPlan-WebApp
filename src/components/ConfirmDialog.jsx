import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-card-hover dark:bg-[#1c1c1e] sm:rounded-3xl"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle size={24} />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink dark:text-white">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{description}</p>}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-[0.98]"
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

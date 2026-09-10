import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-card-hover dark:bg-[#1a1b20] sm:rounded-3xl`}
        >
          <div className="mb-5 flex items-start justify-between">
            <h3 className="text-lg font-bold text-ink dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

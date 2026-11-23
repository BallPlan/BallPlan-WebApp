import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

// Shown when a portal user (agent or support) is signed out because their
// account was deactivated, and when a deactivated account tries to sign in.
export default function AccountDeactivatedDialog({ open, onClose, accountLabel = '' }) {

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="deactivated"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="deactivated-title"
          aria-describedby="deactivated-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-card-hover"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <ShieldAlert size={28} />
            </span>
            <h2 id="deactivated-title" className="mt-4 text-lg font-extrabold text-ink">
              Account deactivated
            </h2>
            <p id="deactivated-desc" className="mt-2 text-sm leading-relaxed text-ink/60">
              Your BallPlan {accountLabel ? `${accountLabel} ` : ''}account has been deactivated, so you've been signed out. Please contact a BallPlan admin to
              restore your access.
            </p>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
            >
              OK, got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

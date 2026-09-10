import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageSquarePlus } from 'lucide-react';
import StarPicker from './StarPicker';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import { useToast } from '../context/ToastContext';

export default function WriteReviewModal({ venue, open, onClose }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const { user } = useAuth();
  const { addReview } = useReviews();
  const { notify } = useToast();

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      notify('Pick a star rating before submitting.', 'warning');
      return;
    }
    if (!text.trim()) {
      notify('Say a little about your experience.', 'warning');
      return;
    }
    addReview(venue.id, { rating, text: text.trim(), name: user?.name });
    notify(`Thanks for reviewing ${venue.name}!`, 'success');
    setRating(0);
    setText('');
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
          <div className="mb-1 flex items-start justify-between">
            <div className="flex items-center gap-2 text-brand">
              <MessageSquarePlus size={18} />
              <h3 className="text-lg font-bold text-ink dark:text-white">Write a review</h3>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <p className="mb-5 text-sm text-ink/55 dark:text-white/55">
            Share your experience at <span className="font-semibold text-ink dark:text-white">{venue.name}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="What stood out? Anything future visitors should know?"
              className="w-full resize-none rounded-xl border border-ink/15 bg-cream p-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
            >
              Post review
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

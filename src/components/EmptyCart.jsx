import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function EmptyCart() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/5"
    >
      <motion.svg
        width="120"
        height="110"
        viewBox="0 0 120 110"
        fill="none"
        initial={{ rotate: -4 }}
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M60 8 L68 20" stroke="#B45819" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="70" cy="14" r="3" fill="#B45819" />
        <path
          d="M22 24H32L44 66H88L98 34H38"
          className="stroke-ink dark:stroke-white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="30" y="40" width="60" height="26" rx="2" className="stroke-ink dark:stroke-white" strokeWidth="2" opacity="0.25" />
        <circle cx="50" cy="92" r="8" className="stroke-ink dark:stroke-white" strokeWidth="3" />
        <circle cx="82" cy="92" r="8" className="stroke-ink dark:stroke-white" strokeWidth="3" />
      </motion.svg>
      <h3 className="mt-6 text-xl font-bold text-ink dark:text-white">Your plan is empty!</h3>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">It looks like you haven't added any items to your plan yet.</p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')}
        className="mt-6 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-card-hover transition hover:bg-brand-dark"
      >
        Browse Products
      </motion.button>
    </motion.div>
  );
}

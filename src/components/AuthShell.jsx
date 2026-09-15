import { motion } from 'framer-motion';
import logoIcon from '../assets/logo-icon.png';
import BackButton from './BackButton';

// A dining/outing scene from the same Unsplash set used for venue photos
// elsewhere in the app (see src/data/venues.js), kept consistent rather
// than introducing a new one-off image just for these two pages.
const HERO_PHOTO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=70&auto=format&fit=crop';

export default function AuthShell({ title, subtitle, children, footer, background = false }) {
  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 ${
        background ? '' : 'bg-cream dark:bg-[#121212]'
      }`}
    >
      {background && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_PHOTO})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/60 to-ink/85" />
        </>
      )}

      <div className="fixed left-4 top-4 z-10 sm:left-6 sm:top-6">
        <BackButton className={background ? 'bg-white/90 text-ink hover:bg-white' : ''} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative z-10 flex w-full max-w-sm flex-col items-center text-center ${
          background ? 'rounded-3xl bg-white/95 p-8 shadow-card-hover backdrop-blur-xl dark:bg-[#1c1c1e]/95' : ''
        }`}
      >
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          src={logoIcon}
          alt="BallPlan"
          className="mb-6 h-16 w-auto"
        />
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink/55 dark:text-white/55">{subtitle}</p>}
        <div className="mt-8 w-full">{children}</div>
      </motion.div>

      {footer && (
        <p
          className={`relative z-10 mt-8 w-full max-w-sm px-6 text-center text-[11px] leading-relaxed sm:fixed sm:bottom-6 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2 ${
            background ? 'text-white/80' : 'text-ink/40 dark:text-white/40'
          }`}
        >
          {footer}
        </p>
      )}
    </div>
  );
}

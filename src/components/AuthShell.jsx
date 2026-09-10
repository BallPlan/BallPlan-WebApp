import { motion } from 'framer-motion';
import logoIcon from '../assets/logo-icon.png';
import BackButton from './BackButton';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-16 dark:bg-[#121212]">
      <div className="fixed left-4 top-4 sm:left-6 sm:top-6">
        <BackButton />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex w-full max-w-sm flex-col items-center text-center"
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
        <p className="fixed bottom-6 left-1/2 w-full max-w-sm -translate-x-1/2 px-6 text-center text-[11px] leading-relaxed text-ink/40 dark:text-white/40">
          {footer}
        </p>
      )}
    </div>
  );
}

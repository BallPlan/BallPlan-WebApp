import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoIcon from '../assets/logo-icon.png';
import BackButton from './BackButton';

export default function LegalPageLayout({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink/8 bg-cream/90 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#121212]/90 sm:px-6">
        <BackButton />
        <Link to="/" className="flex items-center gap-2">
          <img src={logoIcon} alt="" className="h-7 w-auto" />
          <span className="font-display text-base font-extrabold text-ink dark:text-white">BallPlan</span>
        </Link>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-3xl px-6 py-12 sm:px-8"
      >
        <h1 className="font-display text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">{title}</h1>
        {updated && <p className="mt-2 text-sm text-ink/45 dark:text-white/45">Last updated: {updated}</p>}

        <div className="prose-legal mt-10 space-y-10">{children}</div>

        <div className="mt-16 rounded-2xl bg-white p-6 text-sm text-ink/60 shadow-card dark:bg-[#1c1c1e] dark:text-white/60">
          Questions about this document? Reach us at{' '}
          <a href="mailto:info@ballplan.net" className="font-semibold text-brand hover:text-brand-dark">
            info@ballplan.net
          </a>
          .
        </div>
      </motion.main>
    </div>
  );
}

export function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-display text-xl font-bold text-ink dark:text-white sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink/70 dark:text-white/70 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

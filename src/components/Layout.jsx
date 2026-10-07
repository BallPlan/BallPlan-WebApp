import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-cream text-ink dark:bg-[#121212] dark:text-white">
      <Sidebar />
      <div className="lg:pl-20">
        <Header />
        {/* Deliberately no AnimatePresence/exit animation here. Route
            "/" gets reused every time the user returns to Home, so an
            AnimatePresence keyed by location.pathname can be asked to
            mount a new "/" page while the previous "/" instance is still
            mid exit-animation (happens when Back is pressed faster than
            the ~250ms exit takes) — two same-keyed children racing confuses
            framer-motion's presence tracking, and could leave the new page
            stuck at opacity 0 forever (a permanently blank Home after
            pressing the in-app Back button). A plain mount-only fade (no
            exit, no AnimatePresence) has nothing to race: the old page is
            unmounted synchronously by React and the new one just fades in. */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
        >
          <Outlet />
        </motion.main>
      </div>
      <BottomNav />
    </div>
  );
}

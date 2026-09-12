import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Logout() {
  const navigate = useNavigate();
  const { signOut } = useAdminAuth();

  const handleYes = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-card dark:bg-[#1a1b20]"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
          <LogOut size={24} />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-ink dark:text-white">Log out</h1>
        <p className="mt-2 text-sm text-ink/55 dark:text-white/55">
          You are about to log out from BallPlan admin dashboard. Are you sure you want to proceed?
        </p>

        <div className="mt-7 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            No
          </button>
          <button
            onClick={handleYes}
            className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            Yes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

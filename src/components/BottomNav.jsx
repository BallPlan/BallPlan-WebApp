import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Heart, Compass, Bell, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/plan-outing', icon: Compass, label: 'Plan an outing' },
];

export default function BottomNav() {
  const { totalItems } = useCart();

  return (
    <>
      <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-card-hover backdrop-blur dark:bg-[#1c1c1e]/95 lg:hidden">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'text-ink/50 hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10'
              }`
            }
          >
            <Icon size={19} />
          </NavLink>
        ))}
      </nav>

      <NavLink to="/cart" aria-label="Cart" className="fixed bottom-20 right-4 z-50 lg:hidden">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-card-hover dark:bg-white dark:text-ink"
        >
          <ShoppingCart size={22} />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white">
            {totalItems}
          </span>
        </motion.div>
      </NavLink>
    </>
  );
}

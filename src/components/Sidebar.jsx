import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Heart, PlusCircle, Bell, ShoppingCart, User, LogOut } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
  { to: '/plan-outing', icon: PlusCircle, label: 'Plan an outing' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-20 flex-col items-center justify-between border-r border-ink/5 bg-cream py-6 dark:border-white/10 dark:bg-[#121212] lg:flex">
      <NavLink to="/" className="transition hover:scale-105">
        <img src={logoIcon} alt="BallPlan" className="h-9 w-auto" />
      </NavLink>

      <nav className="flex flex-col items-center gap-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={label}
            className={({ isActive }) =>
              `group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'text-ink/50 hover:bg-ink/5 hover:text-ink dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {label}
            </span>
          </NavLink>
        ))}

        <NavLink
          to="/cart"
          aria-label="Cart"
          className={({ isActive }) =>
            `group relative mt-1 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'text-ink/50 hover:bg-ink/5 hover:text-ink dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white'
            }`
          }
        >
          <ShoppingCart size={20} strokeWidth={2} />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
              {totalItems}
            </span>
          )}
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
            Cart
          </span>
        </NavLink>
      </nav>

      {user ? (
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          aria-label="Sign out"
          title={`Signed in as ${user.email}`}
          className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
        >
          <User size={19} className="group-hover:hidden" />
          <LogOut size={17} className="hidden group-hover:block" />
        </button>
      ) : (
        <NavLink
          to="/signin"
          aria-label="Account"
          className={({ isActive }) =>
            `flex h-11 w-11 items-center justify-center rounded-full border transition ${
              isActive
                ? 'border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink'
                : 'border-ink/15 text-ink/60 hover:border-ink/30 dark:border-white/15 dark:text-white/60 dark:hover:border-white/30'
            }`
          }
        >
          <User size={19} />
        </NavLink>
      )}
    </aside>
  );
}

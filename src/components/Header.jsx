import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, LogOut, User, Sun, Moon } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ImageWithFallback from './ImageWithFallback';
import ConfirmDialog from './ConfirmDialog';
import { filterVenues, useVenuesStore } from '../lib/venuesData';
import { formatNaira } from '../utils/currency';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const searchRef = useRef(null);

  const venuesSnapshot = useVenuesStore();
  const results = useMemo(
    () => (query.trim() ? filterVenues({ query: query.trim() }).slice(0, 6) : []),
    [query, venuesSnapshot],
  );
  const showDropdown = searchOpen && query.trim().length > 0;

  useEffect(() => {
    if (!showDropdown) return;
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showDropdown]);

  const goToResult = (id) => {
    setQuery('');
    setSearchOpen(false);
    navigate(`/details/${id}`);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-ink/5 bg-cream/90 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#121212]/90 sm:px-6 lg:px-8">
      <Link to="/" className="flex shrink-0 items-center gap-1.5 lg:hidden">
        <img src={logoIcon} alt="" className="h-7 w-auto" />
        <span className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-white">BallPlan</span>
      </Link>

      <div ref={searchRef} className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
              setSearchOpen(false);
            }
          }}
          placeholder="Search venues, categories, locations..."
          className="w-full rounded-full bg-white py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink/40 shadow-sm outline-none transition focus:shadow-md focus:ring-2 focus:ring-brand/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40"
        />

        {showDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-96 overflow-y-auto rounded-2xl bg-white p-2 shadow-card-hover dark:bg-[#1c1c1e]">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink/40 dark:text-white/40">No matches for “{query.trim()}”.</p>
            ) : (
              results.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => goToResult(venue.id)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-cream dark:hover:bg-white/10"
                >
                  <ImageWithFallback
                    src={venue.hero}
                    seed={venue.id}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink dark:text-white">{venue.name}</p>
                    <p className="truncate text-xs text-ink/40 dark:text-white/40">
                      {venue.category} · {venue.location}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate('/search')}
        aria-label="Search"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-white dark:text-white dark:hover:bg-white/10 sm:hidden"
      >
        <Search size={20} />
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/60 transition hover:bg-white dark:text-white/60 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/plan-outing')}
          className="hidden rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:inline-flex"
        >
          Plan an outing
        </motion.button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand transition hover:bg-brand/20"
              aria-label="Account menu"
            >
              <User size={18} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-11 w-44 overflow-hidden rounded-xl bg-white py-1 shadow-card-hover dark:bg-[#1c1c1e]"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <p className="truncate border-b border-ink/5 px-4 py-2 text-xs text-ink/50 dark:border-white/10 dark:text-white/50">
                  {user.email}
                </p>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setLogoutConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-cream dark:text-white dark:hover:bg-white/10"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold sm:text-sm">
            <Link to="/signup" className="text-brand transition hover:text-brand-dark">
              Sign Up
            </Link>
            <span className="text-ink/20 dark:text-white/20">|</span>
            <Link to="/signin" className="text-brand transition hover:text-brand-dark">
              Sign In
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log out of BallPlan?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Yes, log out"
        cancelLabel="No, stay signed in"
        onConfirm={() => {
          logout();
          setLogoutConfirmOpen(false);
          navigate('/');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </header>
  );
}

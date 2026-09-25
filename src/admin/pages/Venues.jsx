import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, LayoutGrid, List, Star, Eye, Pencil, EyeOff, Trash2, Store, CheckCircle2, XCircle, Award } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import ActionMenu from '../components/ActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import StatCard from '../components/StatCard';
import PostedBy from '../components/PostedBy';
import {
  useVenuesStore,
  getVenues,
  useCategoriesStore,
  getActiveCategoryNames,
  setVenuePublished,
  deleteVenue,
} from '../lib/venuesData';
import { formatNaira } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

export default function Venues() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [view, setView] = useState('list');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const venuesSnapshot = useVenuesStore();
  const categoriesSnapshot = useCategoriesStore();
  const venues = useMemo(() => getVenues(), [venuesSnapshot]);
  const categoryNames = useMemo(() => getActiveCategoryNames(), [categoriesSnapshot]);
  const locations = useMemo(() => Array.from(new Set(venues.map((v) => v.location.split(',').pop().trim()))).sort(), [venues]);

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      if (category !== 'All' && v.tab !== category) return false;
      if (location !== 'All' && !v.location.includes(location)) return false;
      if (query && !`${v.name} ${v.location} ${v.postedBy?.name || ''}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [venues, category, location, query]);

  const handleTogglePublish = async (venue) => {
    try {
      await setVenuePublished(venue.id, venue.published === false);
      notify(`${venue.name} is now ${venue.published === false ? 'published' : 'unpublished'}.`, 'success');
    } catch {
      notify('Could not update this venue.', 'warning');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVenue(deleteTarget.id);
      notify(`${deleteTarget.name} was deleted.`, 'success');
    } catch {
      notify('Could not delete this venue.', 'warning');
    }
    setDeleteTarget(null);
  };

  const activeCount = useMemo(() => venues.filter((v) => v.published !== false).length, [venues]);
  const inactiveCount = venues.length - activeCount;
  const avgRating = useMemo(
    () => (venues.length ? (venues.reduce((sum, v) => sum + (v.rating || 0), 0) / venues.length).toFixed(1) : '0.0'),
    [venues],
  );
  const totalViews = useMemo(() => venues.reduce((sum, v) => sum + (v.viewsCount || 0), 0), [venues]);

  const actionsFor = (venue) => [
    { label: 'View details', icon: Eye, onClick: () => navigate(`/venues/${venue.id}`) },
    { label: 'Edit', icon: Pencil, onClick: () => navigate(`/venues/${venue.id}/edit`) },
    {
      label: venue.published === false ? 'Publish' : 'Unpublish',
      icon: venue.published === false ? Eye : EyeOff,
      onClick: () => handleTogglePublish(venue),
    },
    { divider: true },
    { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(venue) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Venues</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">{venues.length} venues listed on BallPlan.</p>
        </div>
        <Link
          to="/venues/new"
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          <Plus size={16} /> Add Venue
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Venues" value={venues.length} icon={Store} tone="brand" />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Inactive" value={inactiveCount} icon={XCircle} tone="red" />
        <StatCard label="Avg Rating" value={avgRating} icon={Award} tone="amber" />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} tone="sky" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams({});
            }}
            placeholder="Search venues..."
            className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none transition focus:ring-2 focus:ring-brand/20 dark:bg-[#1a1b20] dark:text-white"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full bg-white px-4 py-2.5 text-sm shadow-card outline-none dark:bg-[#1a1b20] dark:text-white"
        >
          {categoryNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-full bg-white px-4 py-2.5 text-sm shadow-card outline-none dark:bg-[#1a1b20] dark:text-white"
        >
          <option value="All">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card dark:bg-[#1a1b20]">
          <button
            onClick={() => setView('list')}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === 'list' ? 'bg-brand text-white dark:bg-brand dark:text-white' : 'text-ink/40 dark:text-white/40'
            }`}
            aria-label="List view"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              view === 'grid' ? 'bg-brand text-white dark:bg-brand dark:text-white' : 'text-ink/40 dark:text-white/40'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">No venues match your filters.</p>
      )}

      {view === 'list' && filtered.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
          <div className="hidden grid-cols-[2fr_0.8fr_0.9fr_0.7fr_1.3fr_0.9fr_0.8fr_0.6fr] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/40 dark:border-white/10 dark:text-white/40 lg:grid">
            <span>Name</span>
            <span>Category</span>
            <span>From Price</span>
            <span>Views</span>
            <span>Posted By</span>
            <span>Date Posted</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-ink/5 dark:divide-white/5">
            {filtered.map((venue) => (
              <div
                key={venue.id}
                className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[2fr_0.8fr_0.9fr_0.7fr_1.3fr_0.9fr_0.8fr_0.6fr] lg:items-center"
              >
                <button
                  onClick={() => navigate(`/venues/${venue.id}`)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <ImageWithFallback src={venue.hero} seed={venue.id} alt={venue.name} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink hover:text-brand dark:text-white">{venue.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-ink/40 dark:text-white/40">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {venue.rating.toFixed(1)} · {venue.location}
                    </p>
                  </div>
                </button>
                <span className="text-sm text-ink/60 dark:text-white/60">{venue.category}</span>
                <span className="text-sm font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
                <span className="flex items-center gap-1 text-sm text-ink/60 dark:text-white/60">
                  <Eye size={13} className="text-ink/35 dark:text-white/35" /> {venue.viewsCount ?? 0}
                </span>
                <PostedBy venue={venue} />
                <span className="text-sm text-ink/60 dark:text-white/60">
                  {venue.createdAt ? new Date(venue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    venue.published === false
                      ? 'bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-white/50'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }`}
                >
                  {venue.published === false ? 'Inactive' : 'Active'}
                </span>
                <div className="flex justify-end">
                  <ActionMenu items={actionsFor(venue)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'grid' && filtered.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((venue) => (
            <motion.div
              key={venue.id}
              whileHover={{ y: -3 }}
              className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]"
            >
              <div className="relative aspect-[4/3]">
                <button onClick={() => navigate(`/venues/${venue.id}`)} className="block h-full w-full">
                  <ImageWithFallback src={venue.hero} seed={venue.id} alt={venue.name} className="h-full w-full object-cover" />
                </button>
                <span
                  className={`pointer-events-none absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    venue.published === false ? 'bg-white/90 text-ink/50' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {venue.published === false ? 'Inactive' : 'Active'}
                </span>
                <div className="absolute right-2 top-2">
                  <ActionMenu
                    items={actionsFor(venue)}
                    buttonClassName="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink/70 shadow-md backdrop-blur transition hover:scale-105"
                  />
                </div>
              </div>
              <button onClick={() => navigate(`/venues/${venue.id}`)} className="block w-full p-3.5 text-left">
                <p className="truncate text-sm font-bold text-ink dark:text-white">{venue.name}</p>
                <p className="truncate text-xs text-ink/40 dark:text-white/40">{venue.category} · {venue.location}</p>
                <p className="mt-1 truncate text-[11px] text-ink/40 dark:text-white/40">
                  Posted by <span className="font-semibold text-ink/60 dark:text-white/60">{venue.postedBy?.name || 'BallPlan Team'}</span>
                  {venue.postedBy?.roleLabel ? ` · ${venue.postedBy.roleLabel}` : ''}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-sm font-bold text-brand">{formatNaira(venue.fromPrice)}</p>
                  <p className="flex items-center gap-1 text-xs text-ink/40 dark:text-white/40">
                    <Eye size={12} /> {venue.viewsCount ?? 0}
                  </p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this venue?"
        description={`"${deleteTarget?.name}" will be permanently removed from BallPlan.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

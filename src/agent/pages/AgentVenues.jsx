import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Star, Eye, Pencil, EyeOff, Trash2, Store } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import ActionMenu from '../../admin/components/ActionMenu';
import ConfirmDialog from '../../admin/components/ConfirmDialog';
import StatCard from '../../admin/components/StatCard';
import { useVenuesStore, getVenues, setVenuePublished, deleteVenue } from '../lib/agentData';
import { formatNaira } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

export default function AgentVenues() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  const venuesSnapshot = useVenuesStore();
  const venues = useMemo(() => getVenues(), [venuesSnapshot]);

  const filtered = useMemo(
    () => venues.filter((v) => !query || `${v.name} ${v.location}`.toLowerCase().includes(query.toLowerCase())),
    [venues, query],
  );

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

  const activeCount = venues.filter((v) => v.published !== false).length;
  const totalViews = venues.reduce((sum, v) => sum + (v.viewsCount || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Your Venues</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">{venues.length} venue{venues.length === 1 ? '' : 's'} posted by you.</p>
        </div>
        <Link
          to="/venues/new"
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          <Plus size={16} /> Add Venue
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 sm:max-w-lg">
        <StatCard label="Total" value={venues.length} icon={Store} tone="brand" />
        <StatCard label="Active" value={activeCount} icon={Eye} tone="emerald" />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} tone="sky" />
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your venues..."
          className="w-full rounded-full bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none transition focus:ring-2 focus:ring-brand/20 dark:bg-[#1a1b20] dark:text-white"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">
          {venues.length === 0 ? "You haven't posted any venues yet." : 'No venues match your search.'}
        </p>
      )}

      {filtered.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
          <div className="hidden grid-cols-[2.2fr_0.9fr_0.7fr_0.9fr_0.8fr_0.6fr] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/40 dark:border-white/10 dark:text-white/40 lg:grid">
            <span>Name</span>
            <span>From Price</span>
            <span>Views</span>
            <span>Date Posted</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-ink/5 dark:divide-white/5">
            {filtered.map((venue) => (
              <div
                key={venue.id}
                className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[2.2fr_0.9fr_0.7fr_0.9fr_0.8fr_0.6fr] lg:items-center"
              >
                <button onClick={() => navigate(`/venues/${venue.id}/edit`)} className="flex min-w-0 items-center gap-3 text-left">
                  <ImageWithFallback src={venue.hero} seed={venue.id} alt={venue.name} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink hover:text-brand dark:text-white">{venue.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-ink/40 dark:text-white/40">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> {venue.rating.toFixed(1)} · {venue.location}
                    </p>
                  </div>
                </button>
                <span className="text-sm font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
                <span className="flex items-center gap-1 text-sm text-ink/60 dark:text-white/60">
                  <Eye size={13} className="text-ink/35 dark:text-white/35" /> {venue.viewsCount ?? 0}
                </span>
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
                  <ActionMenu
                    items={[
                      { label: 'Edit', icon: Pencil, onClick: () => navigate(`/venues/${venue.id}/edit`) },
                      {
                        label: venue.published === false ? 'Publish' : 'Unpublish',
                        icon: venue.published === false ? Eye : EyeOff,
                        onClick: () => handleTogglePublish(venue),
                      },
                      { divider: true },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(venue) },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
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

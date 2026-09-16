import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Star,
  MapPin,
  Phone,
  Clock,
  UtensilsCrossed,
  Ticket,
  Flag,
  ExternalLink,
} from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import ConfirmDialog from '../components/ConfirmDialog';
import { useVenuesStore, getVenueById, setVenuePublished, deleteVenue } from '../lib/venuesData';
import { useReportsStore, getReports, usePriceOverridesStore, getEffectivePrice } from '../../shared/store';
import { formatNaira } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  reviewed: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  resolved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
};

export default function AdminVenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const venuesSnapshot = useVenuesStore();
  const overridesSnapshot = usePriceOverridesStore();
  const reportsSnapshot = useReportsStore();
  const venue = useMemo(() => getVenueById(id), [id, venuesSnapshot]);
  void overridesSnapshot;

  const venueReports = useMemo(
    () => getReports().filter((r) => r.venueId === id).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [id, reportsSnapshot],
  );

  if (!venue) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-ink dark:text-white">Venue not found.</p>
        <Link to="/venues" className="mt-4 inline-block text-brand hover:underline">
          Back to Venues
        </Link>
      </div>
    );
  }

  const priced = (item) => getEffectivePrice(venue.id, item.id, item.price);

  const handleTogglePublish = async () => {
    try {
      await setVenuePublished(venue.id, venue.published === false);
      notify(`${venue.name} is now ${venue.published === false ? 'published' : 'unpublished'}.`, 'success');
    } catch {
      notify('Could not update this venue.', 'warning');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVenue(venue.id);
      notify(`${venue.name} was deleted.`, 'success');
      navigate('/venues');
    } catch {
      notify('Could not delete this venue.', 'warning');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/venues"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-brand hover:text-white dark:bg-[#1a1b20]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-ink dark:text-white">{venue.name}</h1>
            <p className="text-sm text-ink/50 dark:text-white/50">
              {venue.category} · {venue.location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/venues/${venue.id}/edit`}
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
          >
            <Pencil size={14} /> Edit
          </Link>
          <button
            onClick={handleTogglePublish}
            className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            {venue.published === false ? <Eye size={14} /> : <EyeOff size={14} />}
            {venue.published === false ? 'Publish' : 'Unpublish'}
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
            <div className="relative aspect-video">
              <ImageWithFallback src={venue.hero} seed={venue.id} alt={venue.name} className="h-full w-full object-cover" />
              <span
                className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                  venue.published === false ? 'bg-white/90 text-ink/60' : 'bg-emerald-500 text-white'
                }`}
              >
                {venue.published === false ? 'Inactive' : 'Active'}
              </span>
            </div>
            {venue.gallery?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {venue.gallery.map((src, i) => (
                  <ImageWithFallback
                    key={i}
                    src={src}
                    seed={`${venue.id}-${i}`}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            <div className="p-5">
              <p className="text-sm leading-relaxed text-ink/60 dark:text-white/60">{venue.description}</p>
            </div>
          </div>

          {venue.menu?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
                <UtensilsCrossed size={14} className="text-brand" /> Menu ({venue.menu.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {venue.menu.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-2.5 dark:border-white/10">
                    <ImageWithFallback src={item.image} seed={item.id} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink dark:text-white">{item.name}</p>
                      <p className="text-xs font-bold text-brand">{formatNaira(priced(item))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {venue.activities?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
                <Ticket size={14} className="text-brand" /> Activities ({venue.activities.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {venue.activities.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-2.5 dark:border-white/10">
                    <ImageWithFallback src={item.image} seed={item.id} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink dark:text-white">{item.name}</p>
                      <p className="text-xs font-bold text-brand">{formatNaira(priced(item))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {venueReports.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
                <Flag size={14} className="text-brand" /> Price reports for this venue ({venueReports.length})
              </h2>
              <div className="space-y-2">
                {venueReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 p-2.5 text-sm dark:border-white/10">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink dark:text-white">{r.itemName}</p>
                      <p className="text-xs text-ink/40 dark:text-white/40">
                        {formatNaira(r.currentPrice)} → {formatNaira(r.reportedPrice)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                      {r.status[0].toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Overview</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink/50 dark:text-white/50">Rating</span>
                <span className="flex items-center gap-1 font-bold text-ink dark:text-white">
                  <Star size={14} className="fill-amber-400 text-amber-400" /> {venue.rating?.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/50 dark:text-white/50">From price</span>
                <span className="font-bold text-brand">{formatNaira(venue.fromPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink/50 dark:text-white/50">Category</span>
                <span className="font-semibold text-ink dark:text-white">{venue.category}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Contact & hours</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
                <span className="text-ink/70 dark:text-white/70">{venue.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-brand" />
                <span className="text-ink/70 dark:text-white/70">{venue.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="shrink-0 text-brand" />
                <span className="text-ink/70 dark:text-white/70">
                  {venue.openTime} – {venue.closeTime}
                </span>
              </div>
            </div>
            <a
              href={`/details/${venue.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2 text-xs font-semibold text-ink/60 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
            >
              View on storefront <ExternalLink size={12} />
            </a>
          </div>

          {venue.hiddenFees?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Hidden fees</h2>
              <div className="space-y-2 text-sm">
                {venue.hiddenFees.map((f) => (
                  <div key={f.label} className="flex justify-between">
                    <span className="text-ink/60 dark:text-white/60">{f.label}</span>
                    <span className="font-semibold text-ink dark:text-white">{formatNaira(f.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this venue?"
        description={`"${venue.name}" will be permanently removed from BallPlan.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  Star,
  MapPin,
  Phone,
  Clock,
  UtensilsCrossed,
  Tag,
  Ticket,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import MediaView from '../../components/MediaView';
import { groupBySection } from '../../utils/itemSections';
import { useVenuesStore, getVenueById, setVenuePublished } from '../lib/agentData';
import { formatNaira, formatFeeAmount } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

// Menu / Activities grouped by the categories the editor typed (Food,
// Drinks, Desserts, …); a single category shows as a plain list.
function ItemSectionsCard({ title, icon: Icon, items }) {
  const groups = groupBySection(items);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
        <Icon size={14} className="text-brand" /> {title} ({items.length})
      </h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.name}>
            {groups.length > 1 && (
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink/70 dark:text-white/70">
                <Tag size={12} className="text-brand" /> {g.name} ({g.items.length})
              </h3>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-2.5 dark:border-white/10">
                  <ImageWithFallback src={item.image} seed={item.id} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink dark:text-white">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-brand">{formatNaira(item.price)}</p>
                      <span className="flex items-center gap-0.5 text-[11px] text-ink/40 dark:text-white/40">
                        <ShoppingBag size={11} /> {item.cartAddCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentVenueDetails() {
  const { id } = useParams();
  const { notify } = useToast();

  const venuesSnapshot = useVenuesStore();
  const venue = useMemo(() => getVenueById(id), [id, venuesSnapshot]);

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

  const handleTogglePublish = async () => {
    try {
      await setVenuePublished(venue.id, venue.published === false);
      notify(`${venue.name} is now ${venue.published === false ? 'published' : 'unpublished'}.`, 'success');
    } catch {
      notify('Could not update this venue.', 'warning');
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
            <div className="relative aspect-video">
              <MediaView src={venue.hero} seed={venue.id} alt={venue.name} className="h-full w-full object-cover" controls />
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
                  <MediaView
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
            <ItemSectionsCard title="Menu" icon={UtensilsCrossed} items={venue.menu} />
          )}

          {venue.activities?.length > 0 && (
            <ItemSectionsCard title="Activities" icon={Ticket} items={venue.activities} />
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
              <div className="flex items-center justify-between">
                <span className="text-ink/50 dark:text-white/50">Total views</span>
                <span className="flex items-center gap-1 font-bold text-ink dark:text-white">
                  <Eye size={14} className="text-ink/40 dark:text-white/40" /> {venue.viewsCount ?? 0}
                </span>
              </div>              <div className="flex items-center justify-between">
                <span className="text-ink/50 dark:text-white/50">Date posted</span>
                <span className="font-semibold text-ink dark:text-white">
                  {venue.createdAt ? new Date(venue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink/50 dark:text-white/50">Last updated</span>
                <span className="text-right font-semibold text-ink dark:text-white" title={venue.updatedAt || ''}>
                  {venue.updatedAt
                    ? new Date(venue.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
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
                <span className="text-ink/70 dark:text-white/70">{venue.phone || 'No phone number on file'}</span>
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
                    <span className="font-semibold text-ink dark:text-white">{formatFeeAmount(f.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

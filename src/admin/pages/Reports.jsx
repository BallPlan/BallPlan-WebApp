import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Trash2, MessageSquareText, Flag, Clock, CheckCheck } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import ActionMenu from '../components/ActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import StatCard from '../components/StatCard';
import { useReportsStore, getReports, resolveReport, dismissReport, deleteReport } from '../lib/reportsData';
import { useVenuesStore, getVenues } from '../lib/venuesData';
import { formatNaira } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

const FILTERS = ['All', 'Pending', 'Resolved', 'Dismissed'];

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  resolved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  dismissed: 'bg-ink/5 text-ink/50 dark:bg-white/10 dark:text-white/50',
};

function findItem(venues, venueId, itemId) {
  const venue = venues.find((v) => v.id === venueId);
  if (!venue) return { venueName: venueId, itemName: itemId, itemImage: null };
  const item = [...venue.menu, ...venue.activities].find((i) => i.id === itemId);
  return {
    venueName: venue.name,
    itemName: item?.name || itemId,
    itemImage: item?.image || venue.hero,
  };
}

export default function Reports() {
  const [filter, setFilter] = useState('Pending');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  const reportsSnapshot = useReportsStore();
  const venuesSnapshot = useVenuesStore();
  const reports = useMemo(() => {
    const venues = getVenues();
    return getReports().map((r) => ({ ...r, ...findItem(venues, r.venue_id, r.item_id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsSnapshot, venuesSnapshot]);
  const filtered = filter === 'All' ? reports : reports.filter((r) => r.status === filter.toLowerCase());

  const mark = async (report, status) => {
    try {
      if (status === 'resolved') {
        await resolveReport(report.id);
        notify(`Marked resolved — live price updated to ${formatNaira(report.reported_price)}.`, 'success');
      } else {
        await dismissReport(report.id);
        notify('Marked dismissed.', 'info');
      }
    } catch {
      notify('Could not update this report.', 'warning');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReport(deleteTarget.id);
      notify('Report deleted.', 'success');
    } catch {
      notify('Could not delete this report.', 'warning');
    }
    setDeleteTarget(null);
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Reports</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
        Price corrections submitted from "Report Incorrect Price" across the app. Resolving updates the live price everywhere.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Reports" value={reports.length} icon={Flag} tone="brand" />
        <StatCard label="Pending" value={pendingCount} icon={Clock} tone="amber" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCheck} tone="emerald" />
        <StatCard label="Dismissed" value={dismissedCount} icon={EyeOff} tone="sky" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === 'All' ? reports.length : reports.filter((r) => r.status === f.toLowerCase()).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f ? 'bg-brand text-white dark:bg-brand dark:text-white' : 'bg-white text-ink/50 shadow-card dark:bg-[#1a1b20] dark:text-white/50'
              }`}
            >
              {f}
              <span className={filter === f ? 'opacity-60' : 'text-ink/30 dark:text-white/30'}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 py-16 text-center text-sm text-ink/40 dark:border-white/15 dark:bg-white/5 dark:text-white/40">
            No {filter !== 'All' ? filter.toLowerCase() : ''} reports.
          </div>
        )}

        {filtered.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card dark:bg-[#1a1b20] sm:flex-row sm:items-center"
          >
            <ImageWithFallback src={r.itemImage} seed={r.item_id} alt={r.itemName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-ink dark:text-white">{r.itemName}</p>
                <span className="text-xs text-ink/40 dark:text-white/40">· {r.venueName}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                  {r.status[0].toUpperCase() + r.status.slice(1)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink/40 line-through dark:text-white/40">{formatNaira(r.current_price)}</span>
                <span className="text-ink/30">→</span>
                <span className="font-bold text-brand">{formatNaira(r.reported_price)}</span>
                <span className="text-xs text-ink/30 dark:text-white/30">
                  · {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {r.note && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink/50 dark:text-white/50">
                  <MessageSquareText size={13} className="mt-0.5 shrink-0" />
                  {r.note}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ActionMenu
                items={[
                  {
                    label: 'Mark Resolved',
                    icon: CheckCircle2,
                    disabled: r.status === 'resolved',
                    onClick: () => mark(r, 'resolved'),
                  },
                  {
                    label: 'Mark Dismissed',
                    icon: Eye,
                    disabled: r.status === 'dismissed',
                    onClick: () => mark(r, 'dismissed'),
                  },
                  { divider: true },
                  { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
                ]}
              />
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this report?"
        description="This price correction will be permanently removed."
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

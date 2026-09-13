import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, Trash2, MessageSquareText, Flag, Clock, CheckCheck } from 'lucide-react';
import ImageWithFallback from '../../components/ImageWithFallback';
import ActionMenu from '../components/ActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import StatCard from '../components/StatCard';
import { useReportsStore, getReports, updateReportStatus, deleteReport } from '../../shared/store';
import { formatNaira } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';

const FILTERS = ['All', 'Pending', 'Reviewed', 'Resolved'];

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  reviewed: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  resolved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
};

export default function Reports() {
  const [filter, setFilter] = useState('Pending');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  const snapshot = useReportsStore();
  const reports = useMemo(() => [...getReports()].sort((a, b) => new Date(b.date) - new Date(a.date)), [snapshot]);
  const filtered = filter === 'All' ? reports : reports.filter((r) => r.status === filter.toLowerCase());

  const mark = (report, status) => {
    updateReportStatus(report.id, status);
    if (status === 'resolved') {
      notify(`Marked resolved — live price updated to ${formatNaira(report.reportedPrice)}.`, 'success');
    } else {
      notify(`Marked ${status}.`, 'info');
    }
  };

  const handleDelete = () => {
    deleteReport(deleteTarget.id);
    notify('Report deleted.', 'success');
    setDeleteTarget(null);
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const reviewedCount = reports.filter((r) => r.status === 'reviewed').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Reports</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
        Price corrections submitted from "Report Incorrect Price" across the app. Resolving updates the live price everywhere.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Reports" value={reports.length} icon={Flag} tone="brand" />
        <StatCard label="Pending" value={pendingCount} icon={Clock} tone="amber" />
        <StatCard label="Reviewed" value={reviewedCount} icon={Eye} tone="sky" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCheck} tone="emerald" />
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
            <ImageWithFallback src={r.itemImage} seed={r.itemId} alt={r.itemName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-ink dark:text-white">{r.itemName}</p>
                <span className="text-xs text-ink/40 dark:text-white/40">· {r.venueName}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                  {r.status[0].toUpperCase() + r.status.slice(1)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink/40 line-through dark:text-white/40">{formatNaira(r.currentPrice)}</span>
                <span className="text-ink/30">→</span>
                <span className="font-bold text-brand">{formatNaira(r.reportedPrice)}</span>
                <span className="text-xs text-ink/30 dark:text-white/30">
                  · {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    label: 'Mark Reviewed',
                    icon: Eye,
                    disabled: r.status !== 'pending',
                    onClick: () => mark(r, 'reviewed'),
                  },
                  {
                    label: 'Mark Resolved',
                    icon: CheckCircle2,
                    disabled: r.status === 'resolved',
                    onClick: () => mark(r, 'resolved'),
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

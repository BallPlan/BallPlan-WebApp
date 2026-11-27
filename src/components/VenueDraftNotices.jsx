import { useEffect, useState } from 'react';
import { CloudCheck, CloudOff, Loader2, History, RotateCcw, X, ShieldCheck } from 'lucide-react';

// UI pieces for the venue form's autosave (see utils/useVenueDraft).

function ago(ts) {
  if (!ts) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Re-render every 15s so "x minutes ago" stays current.
function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** Small "Saved automatically · just now" indicator for the form header. */
export function AutosaveStatus({ draft }) {
  useTick();
  const { status, lastSavedAt } = draft;
  if (status === 'idle') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink/40 dark:text-white/40">
        <ShieldCheck size={14} /> Autosave on
      </span>
    );
  }
  if (status === 'pending' || status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink/50 dark:text-white/50">
        <Loader2 size={14} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'local') {
    return (
      <span
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
        title="No connection right now. Your changes are kept in this browser and will be backed up online as soon as you're connected again."
      >
        <CloudOff size={14} /> Saved on this device
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <CloudCheck size={14} /> All changes saved {ago(lastSavedAt)}
    </span>
  );
}

/** Banners: "your work was restored" and "Restore changes" for a bigger earlier version. */
export function DraftBanners({ draft, isEdit, onStartOver }) {
  useTick();
  const { restored, backup } = draft;
  return (
    <>
      {backup && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="flex items-start gap-2">
            <History size={17} className="mt-0.5 shrink-0" />
            <span>
              An earlier version of this form had <b>{plural(backup.itemCount, 'menu/activity item')}</b>
              {backup.at ? ` (${ago(backup.at)})` : ''}. Want it back?
            </span>
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={draft.restoreBackup}
              className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
            >
              <RotateCcw size={13} /> Restore changes
            </button>
            <button
              type="button"
              onClick={draft.dismissBackup}
              aria-label="Hide"
              className="rounded-full p-1.5 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {restored && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="flex items-start gap-2">
            <CloudCheck size={17} className="mt-0.5 shrink-0" />
            <span>
              Your unsaved work was restored automatically
              {restored.savedAt ? ` (last changed ${ago(restored.savedAt)})` : ''}
              {restored.itemCount ? `, including ${plural(restored.itemCount, 'menu/activity item')}` : ''}. It stays here until
              you save the venue.
            </span>
          </span>
          <button
            type="button"
            onClick={onStartOver}
            className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
          >
            {isEdit ? 'Use the last saved version instead' : 'Start a new venue from scratch'}
          </button>
        </div>
      )}
    </>
  );
}

/** Shown instead of the form until the venue and any saved work have loaded. */
export function DraftLoading({ slow }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-20 text-center shadow-card dark:bg-[#1a1b20]">
      <Loader2 size={24} className="animate-spin text-brand" />
      <p className="text-sm font-semibold text-ink dark:text-white">Loading venue…</p>
      {slow && (
        <p className="max-w-sm px-4 text-xs text-ink/50 dark:text-white/50">
          This is taking longer than usual. Check your connection. Any unsaved work is safe and will appear once it loads.
        </p>
      )}
    </div>
  );
}

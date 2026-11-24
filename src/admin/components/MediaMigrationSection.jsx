import { useState } from 'react';
import { CloudUpload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { refreshVenues } from '../lib/venuesData';

// Settings > Storage (admin only): one button that moves every venue photo
// and video still stored on Supabase to Cloudinary. The work happens in the
// migrate-media-to-cloudinary Edge Function, a batch per call; this keeps
// calling it until nothing is left. Safe to run again at any time.
export default function MediaMigrationSection() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null); // { total, remaining }
  const [result, setResult] = useState(null); // { ok, message, failures }

  const run = async () => {
    setRunning(true);
    setResult(null);
    setProgress(null);
    const failures = [];
    try {
      let first = true;
      for (;;) {
        const { data, error } = await supabase.functions.invoke('migrate-media-to-cloudinary', {
          body: { retryFailed: first },
        });
        first = false;
        if (error) {
          let message = error.message;
          try {
            message = (await error.context?.json())?.error || message;
          } catch {
            /* keep message */
          }
          throw new Error(message);
        }
        failures.push(...(data.failures || []));
        setProgress({ total: data.total, remaining: data.remaining });
        if (data.done) {
          const moved = data.total - (data.failedTotal || 0);
          setResult({
            ok: !data.failedTotal,
            message:
              data.total === 0
                ? 'Nothing to move — every photo and video is already on Cloudinary (or an outside link).'
                : `Done. ${moved} of ${data.total} file${data.total === 1 ? '' : 's'} now on Cloudinary.` +
                  (data.failedTotal ? ` ${data.failedTotal} could not be copied — run it again to retry them.` : ''),
            failures,
          });
          break;
        }
      }
      await refreshVenues();
    } catch (err) {
      setResult({ ok: false, message: `Stopped: ${err.message}. Run it again to continue where it left off.`, failures });
    } finally {
      setRunning(false);
    }
  };

  const pct = progress && progress.total ? Math.round(((progress.total - progress.remaining) / progress.total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">
        <CloudUpload size={15} className="text-brand" /> Move media to Cloudinary
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60 dark:text-white/60">
        Copies every venue, gallery and menu/activity photo or video that's still stored on Supabase to Cloudinary, then
        switches the venues over to the new links. Outside links (like Unsplash) are left as they are. Customers won't notice
        anything, "Last updated" dates don't change and no notifications are sent. Keep this page open until it finishes.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-4 flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
        {running ? 'Moving…' : 'Move to Cloudinary'}
      </button>

      {running && progress && (
        <div className="mt-4 max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink/50 dark:text-white/50">
            {progress.total - progress.remaining} of {progress.total} files copied…
          </p>
        </div>
      )}

      {result && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${
            result.ok
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
          }`}
        >
          {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
          <div className="min-w-0">
            <p>{result.message}</p>
            {result.failures.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs opacity-80">
                {result.failures.slice(0, 8).map((f, i) => (
                  <li key={i} className="truncate">
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

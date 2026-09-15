import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Search } from 'lucide-react';
import StatCard from '../components/StatCard';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

function toCsv(rows) {
  const header = ['Email', 'Joined'];
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  rows.forEach((r) => {
    lines.push([escape(r.email), escape(new Date(r.created_at).toLocaleString('en-US'))].join(','));
  });
  return lines.join('\r\n');
}

function downloadCsv(rows) {
  const csv = toCsv(rows);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ballplan-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Waitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const { notify } = useToast();

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('waitlist')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) notify('Could not load the waitlist.', 'warning');
        setEntries(data || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => entries.filter((e) => e.email.toLowerCase().includes(query.toLowerCase())),
    [entries, query],
  );

  const todayCount = entries.filter((e) => new Date(e.created_at).toDateString() === new Date().toDateString()).length;

  const handleExport = () => {
    if (filtered.length === 0) {
      notify('Nothing to export.', 'warning');
      return;
    }
    downloadCsv(filtered);
    notify(`Exported ${filtered.length} signup${filtered.length === 1 ? '' : 's'}.`, 'success');
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Waitlist</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Everyone who signed up at /waitlist.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email..."
              className="w-48 rounded-full bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-brand/20 dark:bg-[#1a1b20] dark:text-white sm:w-56"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard label="Total Signups" value={entries.length} icon={ClipboardList} tone="brand" />
        <StatCard label="Joined Today" value={todayCount} icon={ClipboardList} tone="emerald" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
        <div className="hidden grid-cols-[2fr_1fr] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/40 dark:border-white/10 dark:text-white/40 lg:grid">
          <span>Email</span>
          <span>Joined</span>
        </div>
        <div className="divide-y divide-ink/5 dark:divide-white/5">
          {loading && <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">Loading...</p>}
          {!loading &&
            filtered.map((entry) => (
              <div key={entry.id} className="grid grid-cols-1 gap-1.5 px-4 py-3.5 lg:grid-cols-[2fr_1fr] lg:items-center">
                <p className="truncate text-sm font-bold text-ink dark:text-white">{entry.email}</p>
                <span className="text-sm text-ink/60 dark:text-white/60">
                  {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
          {!loading && filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">No signups match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}

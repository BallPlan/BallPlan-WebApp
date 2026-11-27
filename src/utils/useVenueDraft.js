// Autosave for the Add/Edit Venue form (admin, support and agent).
//
// Everything on the form is saved twice, automatically:
//   * in this browser, instantly on every change (survives reloads/crashes);
//   * in the database (venue_drafts), at most ~3 seconds after a change
//     (survives closing the tab, signing out, clearing the browser, or
//     switching device).
// When the form opens, the newest copy is put back automatically — no
// button to press. A copy is only removed once the venue is really saved.
//
// Safety net: whenever a change leaves fewer menu items/activities than
// before, the bigger previous version is kept as a backup (here and in the
// database), and the form offers "Restore changes" to bring it back.
import { useCallback, useEffect, useRef, useState } from 'react';
import { draftKey as legacyDraftKey, readDraft as readLegacyDraft, clearDraft as clearLegacyDraft } from './venueDraft';

const LOCAL_PREFIX = 'ballplan:venue-draft:v2:';
const DEBOUNCE_MS = 1000;
const MAX_WAIT_MS = 3000;
const SERVER_TIMEOUT_MS = 6000;

// Menu items + activities that have anything typed in them.
export function countItems(venue) {
  const inUse = (i) => [i?.name, i?.price, i?.image, i?.desc, i?.section].some((v) => String(v ?? '').trim());
  return [...(venue?.menu || []), ...(venue?.activities || [])].filter(inUse).length;
}

// Form contents only (for "has anything changed?" comparisons).
const fingerprint = (venue) => JSON.stringify(venue ?? null);

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), ms))]);

/**
 * @param client     the portal's Supabase client
 * @param userId     signed-in user's id (drafts are per person)
 * @param portal     'admin' | 'support' | 'agent'
 * @param venueId    venue being edited, or undefined for Add Venue
 * @param saved      the venue as last saved (form shape), or null while loading
 * @param venue      current form state
 * @param setVenue   form state setter
 */
export function useVenueDraft({ client, userId, portal, venueId, saved, venue, setVenue }) {
  const draftKey = venueId || 'new';
  const localKey = `${LOCAL_PREFIX}${portal}:${userId}:${draftKey}`;
  const localBackupKey = `${localKey}:backup`;

  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(null); // { savedAt, itemCount } when a draft was put back
  const [backup, setBackup] = useState(null); // { data, itemCount, at } bigger earlier version
  const [status, setStatus] = useState('idle'); // idle | saving | saved | local
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const baselineRef = useRef(null); // fingerprint the form opened with
  const lastLocalCountRef = useRef(0);
  const timerRef = useRef(null);
  const firstPendingRef = useRef(null);
  const clearedRef = useRef(false); // venue saved: stop autosaving
  const latestRef = useRef(venue);
  latestRef.current = venue;

  // ------------------------------------------------------------ load once
  useEffect(() => {
    if (ready || !userId || !saved) return undefined;
    let cancelled = false;
    (async () => {
      const local = readLocal(localKey); // { data, savedAt }
      const legacy = readLegacyDraft(legacyDraftKey(portal, venueId)); // old drafts (before autosave v2)
      const { data: row } = await withTimeout(
        client
          .from('venue_drafts')
          .select('data, updated_at, backup_data, backup_item_count, backup_at')
          .eq('draft_key', draftKey)
          .maybeSingle(),
        SERVER_TIMEOUT_MS,
      );
      if (cancelled) return;

      const candidates = [
        local?.data && { data: local.data, at: new Date(local.savedAt || 0).getTime() },
        row?.data && { data: row.data, at: new Date(row.updated_at).getTime() },
        legacy && { data: legacy, at: 0 },
      ].filter(Boolean);
      const newest = candidates.sort((a, b) => b.at - a.at)[0];

      const savedPrint = fingerprint(saved);
      const draft = newest && fingerprint({ ...saved, ...newest.data }) !== savedPrint ? { ...saved, ...newest.data } : null;
      // A draft older than the venue's last real save (e.g. saved later from
      // another device) is not put back automatically, only offered.
      const savedUpdatedAt = saved.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
      const stale = draft && newest.at && savedUpdatedAt && newest.at < savedUpdatedAt;

      let start = saved;
      if (draft && !stale) {
        start = draft;
        setRestored({ savedAt: newest.at || null, itemCount: countItems(draft) });
      }

      // Bigger earlier versions (from the database trigger or this browser).
      const backups = [
        row?.backup_data && { data: { ...saved, ...row.backup_data }, itemCount: row.backup_item_count, at: row.backup_at },
        readLocal(localBackupKey),
        stale && { data: draft, itemCount: countItems(draft), at: newest.at },
      ].filter(Boolean);
      const best = backups.sort((a, b) => b.itemCount - a.itemCount)[0];
      if (best && best.itemCount > countItems(start)) setBackup(best);

      baselineRef.current = fingerprint(start);
      lastLocalCountRef.current = countItems(start);
      setVenue(start);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, saved, ready]);

  // --------------------------------------------------------- server save
  const pushToServer = useCallback(async () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    firstPendingRef.current = null;
    if (clearedRef.current) return;
    const data = latestRef.current;
    setStatus('saving');
    const { error } = await client
      .from('venue_drafts')
      .upsert(
        { draft_key: draftKey, data, item_count: countItems(data), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,draft_key' },
      );
    // The venue was saved while this was on its way: remove it again.
    if (clearedRef.current) {
      await client.from('venue_drafts').delete().eq('draft_key', draftKey);
      return;
    }
    if (error) {
      setStatus('local'); // still safe in this browser; retried on the next change
    } else {
      setStatus('saved');
      setLastSavedAt(Date.now());
    }
  }, [client, draftKey]);

  // ------------------------------------------------------- on every change
  useEffect(() => {
    if (!ready || clearedRef.current || fingerprint(venue) === baselineRef.current) return;

    // 1. This browser, right away. Keep a backup if items just went down.
    const count = countItems(venue);
    if (count < lastLocalCountRef.current) {
      const prev = readLocal(localKey);
      const prevBackup = readLocal(localBackupKey);
      if (prev?.data && countItems(prev.data) >= (prevBackup?.itemCount ?? -1)) {
        writeLocal(localBackupKey, { data: prev.data, itemCount: countItems(prev.data), at: prev.savedAt });
      }
    }
    lastLocalCountRef.current = count;
    writeLocal(localKey, { data: venue, savedAt: new Date().toISOString() });

    // 2. The database: 1s after typing stops, but never more than 3s.
    const now = Date.now();
    if (!firstPendingRef.current) firstPendingRef.current = now;
    clearTimeout(timerRef.current);
    const wait = Math.min(DEBOUNCE_MS, MAX_WAIT_MS - (now - firstPendingRef.current));
    timerRef.current = setTimeout(pushToServer, Math.max(0, wait));
    if (status !== 'saving') setStatus('pending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue, ready]);

  // Leaving the page / switching apps: send what's pending straight away.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) pushToServer();
    };
    const onHide = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [pushToServer]);

  // ------------------------------------------------------------- actions
  // After a successful save: the venue is in the database, drafts can go.
  const clear = useCallback(async () => {
    clearedRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    removeLocal(localKey);
    removeLocal(localBackupKey);
    clearLegacyDraft(legacyDraftKey(portal, venueId));
    await client.from('venue_drafts').delete().eq('draft_key', draftKey);
  }, [client, draftKey, localKey, localBackupKey, portal, venueId]);

  // Put the bigger earlier version back.
  const restoreBackup = useCallback(() => {
    if (!backup) return;
    setVenue({ ...backup.data });
    setBackup(null);
  }, [backup, setVenue]);

  // Go back to the last saved venue (what's on screen becomes the backup).
  const startOver = useCallback(() => {
    const current = latestRef.current;
    if (countItems(current) > countItems(saved)) {
      setBackup({ data: current, itemCount: countItems(current), at: new Date().toISOString() });
    }
    setVenue(saved);
    setRestored(null);
  }, [saved, setVenue]);

  return {
    ready,
    restored,
    backup,
    dismissBackup: () => setBackup(null),
    status,
    lastSavedAt,
    clear,
    restoreBackup,
    startOver,
  };
}

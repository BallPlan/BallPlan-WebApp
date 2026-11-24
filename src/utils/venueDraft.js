// Unsaved venue-form drafts, kept in this browser's localStorage so a page
// reload (or a crash, or closing the tab by mistake) doesn't lose what was
// typed. One draft per portal + venue ("new" for the Add Venue page);
// cleared when the venue is saved or the draft is discarded. Only text and
// uploaded-file URLs are stored, never the files themselves.
const PREFIX = 'ballplan:venue-draft:';

export const draftKey = (portal, venueId) => `${PREFIX}${portal}:${venueId || 'new'}`;

export function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDraft(key, venue) {
  try {
    localStorage.setItem(key, JSON.stringify(venue));
  } catch {
    /* storage full or blocked (private mode) — drafts are best-effort */
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

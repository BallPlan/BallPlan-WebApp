// Menu items and activities each carry a free-text category ("section" in
// the database) typed by whoever edits the venue — Food, Drinks, Desserts,
// Water sports… These helpers group a list by it for the main app and the
// admin views.

export const UNCATEGORISED = 'Other';

export function sectionOf(item) {
  return (item.section || '').trim();
}

/**
 * Groups items by section, in the order each section first appears.
 * Names are matched case-insensitively ("drinks" joins "Drinks"); items
 * without one go in a trailing "Other" group.
 * @returns {{ name: string, items: object[] }[]}
 */
export function groupBySection(items = []) {
  const groups = new Map();
  const loose = [];
  items.forEach((item) => {
    const name = sectionOf(item);
    if (!name) {
      loose.push(item);
      return;
    }
    const key = name.toLowerCase();
    if (!groups.has(key)) groups.set(key, { name, items: [] });
    groups.get(key).items.push(item);
  });
  const list = [...groups.values()];
  if (loose.length) list.push({ name: UNCATEGORISED, items: loose });
  return list;
}

/** Distinct section names already used in a list (for form suggestions). */
export function sectionNames(items = []) {
  return groupBySection(items)
    .map((g) => g.name)
    .filter((n) => n !== UNCATEGORISED);
}

/**
 * Categories used across several item lists, most-used first. Spellings
 * that differ only in case count as one ("drinks" + "Drinks"), shown the
 * way they were most often written.
 */
export function rankSections(lists = []) {
  const counts = new Map(); // lower -> { total, spellings: Map }
  lists.forEach((items) =>
    (items || []).forEach((item) => {
      const name = sectionOf(item);
      if (!name) return;
      const key = name.toLowerCase();
      const entry = counts.get(key) || { total: 0, spellings: new Map() };
      entry.total += 1;
      entry.spellings.set(name, (entry.spellings.get(name) || 0) + 1);
      counts.set(key, entry);
    }),
  );
  return [...counts.values()]
    .sort((a, b) => b.total - a.total)
    .map((e) => [...e.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}

/** Joins suggestion lists in order, dropping repeats (case-insensitive). */
export function mergeSuggestions(...groups) {
  const seen = new Set();
  const out = [];
  groups.flat().forEach((name) => {
    const key = String(name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(String(name).trim());
  });
  return out;
}

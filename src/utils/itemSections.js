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

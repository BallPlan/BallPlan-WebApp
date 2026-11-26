// What a venue's two item lists are called. Most venues have a "Menu" and
// "Activities"; cinemas call the menu "Concessions" (popcorn, drinks) and
// the activities "Now Showing" (films, tickets), and list Now Showing first.
// Only the wording/order changes — the data is the same menu/activity lists.
export function isCinema(venue) {
  return /cinema/i.test(`${venue?.tab || ''} ${venue?.category || ''}`);
}

export function isExperience(venue) {
  return /experience/i.test(`${venue?.tab || ''} ${venue?.category || ''}`);
}

export function itemLabels(venue) {
  const labels = isCinema(venue)
    ? { menu: 'Concessions', activities: 'Now Showing', menuItem: 'concession', activityItem: 'showing', activitiesFirst: true }
    : { menu: 'Menu', activities: 'Activities', menuItem: 'menu item', activityItem: 'activity', activitiesFirst: false };
  // Experiences venues don't have to put their items into categories, and
  // can list free things (₦0, e.g. free entry).
  return { ...labels, sectionOptional: isExperience(venue), freeAllowed: isExperience(venue) };
}

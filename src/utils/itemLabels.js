// What a venue's two item lists are called. Most venues have a "Menu" and
// "Activities"; cinemas call the menu "Concessions" (popcorn, drinks) and
// the activities "Now Showing" (films, tickets), and list Now Showing first.
// Only the wording/order changes — the data is the same menu/activity lists.
export function isCinema(venue) {
  return /cinema/i.test(`${venue?.tab || ''} ${venue?.category || ''}`);
}

export function itemLabels(venue) {
  return isCinema(venue)
    ? { menu: 'Concessions', activities: 'Now Showing', menuItem: 'concession', activityItem: 'showing', activitiesFirst: true }
    : { menu: 'Menu', activities: 'Activities', menuItem: 'menu item', activityItem: 'activity', activitiesFirst: false };
}

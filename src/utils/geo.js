// Approximate coordinates per Lagos-area neighbourhood, used to place a venue
// pin on an embedded OpenStreetMap (no API key needed). These are area
// centroids, not surveyed addresses — accurate enough to show "which part of
// Lagos" at a glance, with a small deterministic jitter per venue so venues
// sharing a neighbourhood don't stack on the exact same pixel.

const AREA_COORDS = [
  { match: 'allen avenue', lat: 6.6013, lng: 3.3487 },
  { match: 'ikoyi', lat: 6.4531, lng: 3.4359 },
  { match: 'lekki phase 1', lat: 6.4415, lng: 3.4732 },
  { match: 'ikate, lekki', lat: 6.452, lng: 3.521 },
  { match: 'ibeju-lekki', lat: 6.472, lng: 3.68 },
  { match: 'lekki', lat: 6.465, lng: 3.539 },
  { match: 'surulere', lat: 6.5059, lng: 3.3547 },
  { match: 'lagos island', lat: 6.455, lng: 3.3941 },
  { match: 'victoria island', lat: 6.4281, lng: 3.4219 },
  { match: 'arepo', lat: 6.6959, lng: 3.3853 },
  { match: 'ikeja', lat: 6.6018, lng: 3.3515 },
];

const FALLBACK = { lat: 6.5244, lng: 3.3792 }; // Lagos mainland centroid

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getVenueCoords(venue) {
  const loc = venue.location.toLowerCase();
  const area = AREA_COORDS.find((a) => loc.includes(a.match)) || FALLBACK;
  const seed = hashString(venue.id);
  const jitterLat = ((seed % 100) / 100 - 0.5) * 0.012;
  const jitterLng = (((seed >> 8) % 100) / 100 - 0.5) * 0.012;
  return { lat: area.lat + jitterLat, lng: area.lng + jitterLng };
}

export function osmEmbedUrl({ lat, lng }, deltaDeg = 0.006) {
  const bbox = [lng - deltaDeg, lat - deltaDeg, lng + deltaDeg, lat + deltaDeg].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function osmViewUrl({ lat, lng }) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

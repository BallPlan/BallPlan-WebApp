export function directionsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function openDirections(address) {
  window.open(directionsUrl(address), '_blank', 'noopener,noreferrer');
}

// lucide-react (this project's version) doesn't ship brand/social glyphs,
// so these are small hand-drawn equivalents sized to match lucide icons.
export function InstagramIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function XIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.6 10.6 20.3 3h-2l-5.8 6.6L7.8 3H3l7 9.9L3 21h2l6.2-7 5 7H21l-7.4-10.4Zm-2.2 2.5-.7-1L5 4.6h2.2l4.6 6.4.7 1 6 8.4h-2.2l-4.9-6.9Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <line x1="7.5" y1="10" x2="7.5" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7.5" cy="6.8" r="1.3" fill="currentColor" />
      <path
        d="M11.5 17v-4c0-1.5 1-2.5 2.2-2.5s2.3 1 2.3 2.5v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="11.5" y1="10" x2="11.5" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

import { useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import VenueCard from '../components/VenueCard';
import BackButton from '../components/BackButton';
import { filterVenues, useVenuesStore } from '../lib/venuesData';

export default function Search() {
  const [query, setQuery] = useState('');

  const venuesSnapshot = useVenuesStore();
  const results = useMemo(() => (query ? filterVenues({ query }) : []), [query, venuesSnapshot]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <div className="relative flex-1">
          <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venues, categories, locations..."
            className="w-full rounded-full border border-ink/10 bg-white py-3.5 pl-12 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>
      </div>

      {!query && (
        <p className="py-16 text-center text-ink/40 dark:text-white/40">Start typing to search across every category.</p>
      )}

      {query && results.length === 0 && (
        <p className="py-16 text-center text-ink/50 dark:text-white/50">No matches for “{query}”. Try another search.</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((venue, i) => (
            <VenueCard venue={venue} key={venue.id} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

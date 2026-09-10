import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarPicker({ value, onChange, size = 30 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="transition hover:scale-110"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star size={size} className={filled ? 'fill-amber-400 text-amber-400' : 'text-ink/15'} />
          </button>
        );
      })}
    </div>
  );
}

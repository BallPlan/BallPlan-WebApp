import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCategoriesStore, getActiveCategoryNames } from '../shared/store';

export default function CategoryTabs({ active, onChange }) {
  const snapshot = useCategoriesStore();
  const categoryNames = useMemo(() => getActiveCategoryNames(), [snapshot]);

  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {categoryNames.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'text-white dark:text-ink'
                : 'bg-white text-ink/60 shadow-sm hover:text-ink dark:bg-white/10 dark:text-white/60 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-brand dark:bg-brand"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

export default function ActionMenu({ items, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          'flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 dark:text-white/50 dark:hover:bg-white/10'
        }
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white p-1 shadow-card-hover dark:bg-[#1e1f24]"
          >
            {items.map((it, i) =>
              it.divider ? (
                <div key={i} className="my-1 h-px bg-ink/8 dark:bg-white/10" />
              ) : (
                <button
                  key={it.label}
                  onClick={() => {
                    setOpen(false);
                    it.onClick();
                  }}
                  disabled={it.disabled}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    it.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                      : 'text-ink/75 hover:bg-ink/5 dark:text-white/75 dark:hover:bg-white/10'
                  }`}
                >
                  {it.icon && <it.icon size={14} />}
                  {it.label}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

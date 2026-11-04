import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';
import MediaView from './MediaView';
import { isVideoUrl } from '../utils/uploadMedia';

const SLIDE_MS = 5000;

// Venue page hero: the main photo/video on top and, when there's more than
// one, a row of thumbnails *underneath* it (not overlaid on the photo, same
// as the admin venue view). The main slide advances by itself every 5s; a
// video slide plays through (muted) and advances when it ends instead.
// Tapping a thumbnail jumps to it and restarts the timer; tapping the main
// slide opens it full screen. `paused` stops the rotation (e.g. while the
// lightbox is open). `overlay` is drawn over the main slide (back/favorite
// buttons).
export default function VenueGallery({ media, venueId, alt, paused = false, onOpen, overlay }) {
  const [index, setIndex] = useState(0);
  const count = media.length;
  const current = media[Math.min(index, count - 1)];
  const currentIsVideo = isVideoUrl(current);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused || currentIsVideo) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, count, paused, currentIsVideo]);

  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-[#1c1c1e]">
      <div className="relative aspect-[16/10] overflow-hidden bg-ink/5 dark:bg-white/5 sm:aspect-[16/8]">
        <AnimatePresence initial={false}>
          <motion.div
            key={`${index}-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <MediaView
              src={current}
              seed={`${venueId}-${index}`}
              alt={alt}
              className="h-full w-full cursor-pointer object-cover"
              onClick={() => onOpen?.(index)}
              autoPlay
              onEnded={count > 1 ? next : undefined}
              loop={count < 2}
            />
          </motion.div>
        </AnimatePresence>
        {overlay}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto p-2.5 sm:gap-3 sm:p-3">
          {media.map((src, i) => (
            <button
              key={`${i}-${src}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${isVideoUrl(src) ? 'video' : 'photo'} ${i + 1} of ${count}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition sm:h-16 sm:w-24 ${
                i === index ? 'ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e]' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <MediaView src={src} seed={`${venueId}-${i}`} alt="" className="h-full w-full object-cover" />
              {isVideoUrl(src) && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                  <Play size={16} className="fill-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useIsDarkMode } from '../utils/useIsDarkMode';

const shimmerStyle = (isDark) => ({
  backgroundImage: isDark
    ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 100%)'
    : 'linear-gradient(90deg, rgba(18,18,18,0.05) 0%, rgba(18,18,18,0.12) 50%, rgba(18,18,18,0.05) 100%)',
  backgroundSize: '400px 100%',
  backgroundRepeat: 'no-repeat',
});

export default function ImageWithFallback({ src, seed, alt = '', className = '', style, ...rest }) {
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(seed || alt || 'ballplan')}/800/600`;
  const [current, setCurrent] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const isDark = useIsDarkMode();

  return (
    <img
      src={current}
      alt={alt}
      onError={() => setCurrent(fallback)}
      onLoad={() => setLoaded(true)}
      className={`${!loaded ? 'animate-shimmer' : ''} ${className}`}
      style={{ ...(!loaded ? shimmerStyle(isDark) : null), ...style }}
      {...rest}
    />
  );
}

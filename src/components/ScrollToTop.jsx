import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// The app is a single page, so without this a newly opened page keeps the
// previous page's scroll position — tapping a venue far down Home opened
// Details already scrolled to its Menu/Activities. New navigations start at
// the top. Back/Forward (POP) returns to where you were on that page: the
// browser's own restoration fires before the venue list has re-rendered
// and lands short, so positions are remembered per history entry here and
// re-applied once the page is tall enough (or after ~1.5s, whichever first).
const positions = new Map();

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const keyRef = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => positions.set(keyRef.current, window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    keyRef.current = location.key;
    const target = navigationType === 'POP' ? positions.get(location.key) || 0 : 0;
    if (!target) {
      window.scrollTo(0, 0);
      return undefined;
    }

    let frame = 0;
    const started = performance.now();
    const tryRestore = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= target || performance.now() - started > 1500) {
        window.scrollTo(0, Math.min(target, maxScroll));
        return;
      }
      frame = requestAnimationFrame(tryRestore);
    };
    tryRestore();
    return () => cancelAnimationFrame(frame);
  }, [location.key, navigationType]);

  return null;
}

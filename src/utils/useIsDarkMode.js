import { useEffect, useState } from 'react';

// Reads the `.dark` class straight off <html> via a MutationObserver — works
// in both bundles (the consumer app's ThemeContext and the admin app's
// ThemeSync both just toggle that same class on their own document root) so
// shared components like ImageWithFallback don't need to depend on either
// bundle's specific theme provider.
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

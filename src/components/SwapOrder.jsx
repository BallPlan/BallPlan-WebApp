import { Children } from 'react';

// Renders its children in reverse order when `swap` is true. Used to show a
// cinema's "Now Showing" (activities) before its "Concessions" (menu).
export default function SwapOrder({ swap, children }) {
  const kids = Children.toArray(children);
  return swap ? kids.reverse() : kids;
}

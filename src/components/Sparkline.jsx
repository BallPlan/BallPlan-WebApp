import { useMemo, useState } from 'react';
import { formatNaira } from '../utils/currency';
import { useIsDarkMode } from '../utils/useIsDarkMode';

// Stat-tile sparkline convention: history in a de-emphasis gray, only the
// current point (and the segment leading to it) picks up the status accent.
const STATUS_COLOR = { up: '#d03b3b', down: '#0ca30c', flat: '#898781' };
const MUTED_LINE = '#c3c2b7';

export default function Sparkline({ points, trend, width = 160, height = 44 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const isDark = useIsDarkMode();
  const surface = isDark ? '#1c1c1e' : '#fff';
  const gridColor = isDark ? 'rgba(255,255,255,0.15)' : '#e1e0d9';

  const coords = useMemo(() => {
    const padX = 6;
    const padY = 8;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    return points.map((p, i) => [
      padX + (i / (points.length - 1)) * innerW,
      padY + innerH - ((p - min) / range) * innerH,
    ]);
  }, [points, width, height]);

  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const accent = STATUS_COLOR[trend] || STATUS_COLOR.flat;
  const lastIdx = points.length - 1;
  const [lastX, lastY] = coords[lastIdx];
  const [prevX, prevY] = coords[lastIdx - 1] || coords[lastIdx];

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach(([x], i) => {
      const d = Math.abs(x - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  return (
    <div className="relative" onMouseLeave={() => setHoverIndex(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMove}
        className="block overflow-visible"
        role="img"
        aria-label={`Price trend over the last ${points.length} weeks`}
      >
        <path d={path} fill="none" stroke={MUTED_LINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={prevX} y1={prevY} x2={lastX} y2={lastY} stroke={accent} strokeWidth={2} strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r={5} fill={surface} />
        <circle cx={lastX} cy={lastY} r={4} fill={accent} />

        {hoverIndex != null && (
          <>
            <line
              x1={coords[hoverIndex][0]}
              y1={4}
              x2={coords[hoverIndex][0]}
              y2={height - 4}
              stroke={gridColor}
              strokeWidth={1}
            />
            <circle
              cx={coords[hoverIndex][0]}
              cy={coords[hoverIndex][1]}
              r={4}
              fill={surface}
              stroke={hoverIndex === lastIdx ? accent : '#52514e'}
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {hoverIndex != null && (
        <div
          className="pointer-events-none absolute -top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-lg dark:bg-white dark:text-ink"
          style={{ left: `${(coords[hoverIndex][0] / width) * 100}%` }}
        >
          {formatNaira(points[hoverIndex])} · {hoverIndex === lastIdx ? 'now' : `${lastIdx - hoverIndex}w ago`}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';

// Trend over time, single series -> one hue (brand), per the same convention
// used for the price-history sparkline: 2px line, ~10% area wash, hairline
// baseline, hover crosshair + tooltip.
const LINE_COLOR = '#B45819';

export default function VisitorLineChart({ data, dark, width = 700, height = 240 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const gridColor = dark ? '#2c2c2a' : '#e1e0d9';
  const mutedText = '#898781';

  const padX = 8;
  const padTop = 16;
  const padBottom = 30;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const { coords, areaPath, linePath } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    const coords = data.map((d, i) => [
      padX + (i / Math.max(data.length - 1, 1)) * innerW,
      padTop + innerH - (d.count / max) * innerH,
    ]);
    const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const baseline = padTop + innerH;
    const areaPath =
      coords.length > 1
        ? `${linePath} L${coords[coords.length - 1][0]},${baseline} L${coords[0][0]},${baseline} Z`
        : '';
    return { coords, areaPath, linePath };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height]);

  const lastIdx = data.length - 1;
  const baselineY = padTop + innerH;

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

  // label a handful of x-axis ticks, never every point
  const tickIdxs = useMemo(() => {
    const n = Math.min(5, data.length);
    if (n <= 1) return [0];
    return Array.from({ length: n }, (_, i) => Math.round((i * (data.length - 1)) / (n - 1)));
  }, [data.length]);

  return (
    <div className="relative" onMouseLeave={() => setHoverIndex(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onMouseMove={handleMove}
        className="block overflow-visible"
        role="img"
        aria-label="Website visitors over time"
      >
        <line x1={padX} y1={baselineY} x2={width - padX} y2={baselineY} stroke={gridColor} strokeWidth={1} />
        {areaPath && <path d={areaPath} fill={LINE_COLOR} opacity={0.1} stroke="none" />}
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.length > 0 && (
          <>
            <circle cx={coords[lastIdx][0]} cy={coords[lastIdx][1]} r={5} fill={dark ? '#1a1b20' : '#fff'} />
            <circle cx={coords[lastIdx][0]} cy={coords[lastIdx][1]} r={4} fill={LINE_COLOR} />
          </>
        )}

        {hoverIndex != null && coords[hoverIndex] && (
          <>
            <line
              x1={coords[hoverIndex][0]}
              y1={padTop - 4}
              x2={coords[hoverIndex][0]}
              y2={baselineY}
              stroke={gridColor}
              strokeWidth={1}
            />
            <circle
              cx={coords[hoverIndex][0]}
              cy={coords[hoverIndex][1]}
              r={4}
              fill={dark ? '#1a1b20' : '#fff'}
              stroke={LINE_COLOR}
              strokeWidth={2}
            />
          </>
        )}

        {tickIdxs.map((i) => (
          <text
            key={i}
            x={coords[i]?.[0] ?? 0}
            y={height - 8}
            fontSize="10"
            fill={mutedText}
            textAnchor={i === 0 ? 'start' : i === lastIdx ? 'end' : 'middle'}
          >
            {data[i]?.label}
          </text>
        ))}
      </svg>

      {hoverIndex != null && data[hoverIndex] && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-lg dark:bg-white dark:text-ink"
          style={{ left: `${(coords[hoverIndex][0] / width) * 100}%` }}
        >
          {data[hoverIndex].label} · {data[hoverIndex].count.toLocaleString()} visitors
        </div>
      )}
    </div>
  );
}

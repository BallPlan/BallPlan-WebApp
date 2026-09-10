// One meter per star level: single-hue fill on a lighter step of the same
// ramp, per row — the star numbers already carry the order, so the fill
// doesn't need to encode rank with a different hue per row.
export default function RatingDistribution({ distribution, total }) {
  return (
    <div className="space-y-1.5">
      {distribution.map(({ star, count }) => {
        const pct = total ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 shrink-0 font-semibold text-ink/50 dark:text-white/50">{star}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-400/15">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-ink/40 dark:text-white/40">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

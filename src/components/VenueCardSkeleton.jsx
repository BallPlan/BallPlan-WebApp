// Placeholder shown in VenueCard's exact layout while venues are still
// loading, so the grid "unveils" into real cards instead of jumping from
// an empty-state message straight to content.
export default function VenueCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1c1c1e]">
      <div className="aspect-[4/3] bg-ink/10 dark:bg-white/10" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-2/3 rounded-full bg-ink/10 dark:bg-white/10" />
          <div className="h-4 w-10 shrink-0 rounded-full bg-ink/10 dark:bg-white/10" />
        </div>
        <div className="h-3 w-1/2 rounded-full bg-ink/10 dark:bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-ink/10 dark:bg-white/10" />
          <div className="h-3 w-3/4 rounded-full bg-ink/10 dark:bg-white/10" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="h-4 w-20 rounded-full bg-ink/10 dark:bg-white/10" />
          <div className="h-7 w-16 rounded-full bg-ink/10 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

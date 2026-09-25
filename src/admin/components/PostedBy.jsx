// Who listed a venue — an admin, a support account or an agent. Venues
// added by the BallPlan team before ownership was tracked have no poster.
const ROLE_TONE = {
  owner: 'bg-brand/10 text-brand',
  support: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  agent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
};

export default function PostedBy({ venue, size = 'md' }) {
  const poster = venue.postedBy;
  const name = poster?.name || 'BallPlan Team';
  const roleLabel = poster ? poster.roleLabel : 'System';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const dim = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  return (
    <span className="flex min-w-0 items-center gap-2">
      {poster?.avatarUrl ? (
        <img src={poster.avatarUrl} alt="" className={`${dim} shrink-0 rounded-full object-cover`} />
      ) : (
        <span className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-ink/8 font-bold text-ink/60 dark:bg-white/10 dark:text-white/60`}>
          {initials}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink dark:text-white">{name}</span>
        {roleLabel && (
          <span
            className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[10px] font-bold ${
              ROLE_TONE[poster?.role] || 'bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-white/50'
            }`}
          >
            {roleLabel}
          </span>
        )}
      </span>
    </span>
  );
}

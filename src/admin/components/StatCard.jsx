export default function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const TONES = {
    brand: 'bg-brand/10 text-brand',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    red: 'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 text-2xl font-extrabold text-ink dark:text-white">{value}</p>
      <p className="text-xs font-medium text-ink/45 dark:text-white/45">{label}</p>
    </div>
  );
}

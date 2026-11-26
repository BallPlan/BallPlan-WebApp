import { Check, X } from 'lucide-react';

// Green check / red cross used in the daily activity tables (admin Agent
// details and the agent's own Streak page).
export default function DayMark({ on, label }) {
  return on ? (
    <span
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
    >
      <Check size={15} strokeWidth={3} />
    </span>
  ) : (
    <span
      title={`No ${label.toLowerCase()}`}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-400 dark:bg-red-500/10 dark:text-red-400/80"
    >
      <X size={15} strokeWidth={3} />
    </span>
  );
}

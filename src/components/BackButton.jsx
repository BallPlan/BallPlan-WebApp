import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Back"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-ink hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink ${className}`}
    >
      <ArrowLeft size={18} />
    </button>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Sparkles, Loader2 } from 'lucide-react';
import BackButton from '../components/BackButton';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { getActiveCategoryNames, getPublishedVenues, useVenuesStore, useCategoriesStore } from '../lib/venuesData';
import { useToast } from '../context/ToastContext';
import { integerInputProps } from '../utils/integerInput';

export default function BallPlanPlan() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [max, setMax] = useState('');
  const [location, setLocation] = useState([]);
  const [people, setPeople] = useState(2);
  const [category, setCategory] = useState([]);
  const [info, setInfo] = useState('');
  const [generating, setGenerating] = useState(false);

  const venuesSnapshot = useVenuesStore();
  const categoriesSnapshot = useCategoriesStore();
  const categories = useMemo(() => getActiveCategoryNames().filter((c) => c !== 'All'), [categoriesSnapshot]);
  const locations = useMemo(
    () => Array.from(new Set(getPublishedVenues().map((v) => v.location.split(',')[0].trim()))).sort(),
    [venuesSnapshot],
  );

  const handleGenerate = (e) => {
    e.preventDefault();

    if (!max.trim()) return notify('Enter your budget.', 'warning');

    const maxVal = Number(max);
    if (maxVal <= 0) return notify('Enter a valid budget.', 'warning');
    if (location.length === 0) return notify('Select at least one location.', 'warning');
    if (category.length === 0) return notify('Select at least one category.', 'warning');

    console.log('[ballplan-plan] generating with', {
      maxVal,
      location,
      people,
      category,
      info,
    });
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      navigate('/plan-outing/result', {
        state: { max: maxVal, location, people, category, info },
      });
    }, 1600);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3">
        <BackButton />
      </div>
      <div className="flex items-center gap-2 text-brand">
        <Sparkles size={20} />
        <span className="text-xs font-bold uppercase tracking-wider">BallPlan AI</span>
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">Plan an outing</h1>
      <p className="mt-2 text-ink/55 dark:text-white/55">Let's help you plan your outing with your budget</p>

      <form onSubmit={handleGenerate} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">Tell us your budget</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40">₦</span>
            <input
              {...integerInputProps(max, setMax)}
              placeholder="50000"
              className="w-full rounded-2xl border border-transparent bg-white py-3.5 pl-8 pr-16 text-sm text-ink shadow-card outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-[#1c1c1e] dark:text-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-ink/40">Max.</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">
            Location <span className="font-normal text-ink/40 dark:text-white/40">(select as many as you like)</span>
          </label>
          <MultiSelectDropdown value={location} onChange={setLocation} placeholder="Search and select locations" options={locations} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">Number of people</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition hover:bg-brand-dark active:scale-90"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center text-base font-bold text-ink dark:text-white">{people}</span>
            <button
              type="button"
              onClick={() => setPeople((p) => p + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition hover:bg-brand-dark active:scale-90"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">
            Category <span className="font-normal text-ink/40 dark:text-white/40">(select as many as you like)</span>
          </label>
          <MultiSelectDropdown value={category} onChange={setCategory} placeholder="Search and select categories" options={categories} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">More information if any (opt.)</label>
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            rows={4}
            placeholder="Write more information if you have any — e.g. anniversary dinner, need parking, prefer outdoor seating..."
            className="w-full resize-none rounded-2xl bg-white p-4 text-sm text-ink shadow-card outline-none transition focus:ring-2 focus:ring-brand/20 dark:bg-[#1c1c1e] dark:text-white"
          />
        </div>

        <motion.button
          whileHover={{ scale: generating ? 1 : 1.02 }}
          whileTap={{ scale: generating ? 1 : 0.98 }}
          type="submit"
          disabled={generating}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Finding your perfect outing...
            </>
          ) : (
            'Generate'
          )}
        </motion.button>
      </form>
    </div>
  );
}

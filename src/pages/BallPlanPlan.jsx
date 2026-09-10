import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Sparkles, Loader2, Check } from 'lucide-react';
import BackButton from '../components/BackButton';
import { getActiveCategoryNames, getPublishedVenues, useVenuesStore, useCategoriesStore } from '../shared/store';
import { useToast } from '../context/ToastContext';
import { integerInputProps } from '../utils/integerInput';

export default function BallPlanPlan() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [min, setMin] = useState('10000');
  const [max, setMax] = useState('50000');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [people, setPeople] = useState(2);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [info, setInfo] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleValue = (setter) => (value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  const toggleLocation = toggleValue(setSelectedLocations);
  const toggleCategory = toggleValue(setSelectedCategories);

  const venuesSnapshot = useVenuesStore();
  const categoriesSnapshot = useCategoriesStore();
  const categories = useMemo(() => getActiveCategoryNames(), [categoriesSnapshot]);
  const locations = useMemo(
    () => Array.from(new Set(getPublishedVenues().map((v) => v.location.split(',')[0].trim()))).sort(),
    [venuesSnapshot],
  );

  const handleGenerate = (e) => {
    e.preventDefault();
    const minVal = Number(min) || 0;
    const maxVal = Number(max) || 0;
    if (maxVal <= 0) {
      notify('Enter a valid maximum budget.', 'warning');
      return;
    }
    if (minVal > maxVal) {
      notify('Minimum budget cannot be greater than maximum.', 'warning');
      return;
    }

    console.log('[ballplan-plan] generating with', {
      minVal,
      maxVal,
      locations: selectedLocations,
      people,
      categories: selectedCategories,
      info,
    });
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      navigate('/plan-outing/result', {
        state: { min: minVal, max: maxVal, location: selectedLocations, people, category: selectedCategories, info },
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
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">Tell us your budget range</label>
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40">₦</span>
              <input
                {...integerInputProps(min, setMin)}
                placeholder="10000"
                className="w-full rounded-2xl border border-transparent bg-white py-3.5 pl-8 pr-16 text-sm text-ink shadow-card outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-[#1c1c1e] dark:text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-ink/40">Min.</span>
            </div>
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
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink/70 dark:text-white/70">
            Location <span className="font-normal text-ink/40 dark:text-white/40">(select as many as you like)</span>
          </label>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-card dark:bg-[#1c1c1e]">
            {locations.map((loc) => {
              const active = selectedLocations.includes(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-ink text-white dark:bg-white dark:text-ink'
                      : 'bg-cream text-ink/60 hover:text-ink dark:bg-white/10 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  {active && <Check size={13} />}
                  {loc}
                </button>
              );
            })}
          </div>
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
          <div className="flex flex-wrap gap-2 rounded-2xl border border-brand/30 bg-white p-3 shadow-sm dark:bg-[#1c1c1e]">
            {categories.filter((c) => c !== 'All').map((c) => {
              const active = selectedCategories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-brand text-white'
                      : 'bg-cream text-ink/60 hover:text-ink dark:bg-white/10 dark:text-white/60 dark:hover:text-white'
                  }`}
                >
                  {active && <Check size={13} />}
                  {c}
                </button>
              );
            })}
          </div>
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

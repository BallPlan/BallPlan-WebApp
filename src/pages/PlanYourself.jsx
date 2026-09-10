import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Check, ArrowRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useBudget } from '../context/BudgetContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/currency';
import { integerInputProps } from '../utils/integerInput';

const PRESETS = [10000, 20000, 50000, 100000];

export default function PlanYourself() {
  const [capEnabled, setCapEnabled] = useState(false);
  const [amount, setAmount] = useState('20000');
  const { startBudget } = useBudget();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    if (!capEnabled) return;

    const value = Number(amount);
    if (!value || value <= 0) {
      notify('Enter a valid budget to get started.', 'warning');
      return;
    }
    console.log('[plan-yourself] starting with budget', value);
    startBudget(value);
    notify(`Budget set to ${formatNaira(value)}. We'll warn you if you go over.`, 'success');
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3">
        <BackButton />
      </div>
      <div className="flex items-center gap-2 text-brand">
        <Wallet size={20} />
        <span className="text-xs font-bold uppercase tracking-wider">Self-guided</span>
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">Plan your outing</h1>
      <p className="mt-2 text-ink/55 dark:text-white/55">
        Browse freely at your own pace — set a spending cap below to unlock browsing and we'll keep watch on your cart.
      </p>

      <form onSubmit={handleStart} className="mt-8 space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-card dark:bg-[#1c1c1e]">
          <button
            type="button"
            onClick={() => setCapEnabled((v) => !v)}
            className="flex w-full items-start gap-3 text-left"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                capEnabled
                  ? 'border-brand bg-brand text-white'
                  : 'border-ink/20 bg-white text-transparent dark:border-white/20 dark:bg-white/10'
              }`}
            >
              <Check size={15} strokeWidth={3} />
            </span>
            <span className="flex items-center gap-2">
              <Wallet size={18} className="text-brand" />
              <span className="text-base font-bold text-ink dark:text-white">Set a spending cap</span>
            </span>
          </button>
          <p className="ml-9 mt-1 text-sm text-ink/50 dark:text-white/50">We'll warn you before your cart goes over this amount.</p>

          <div
            className={`mt-4 transition-opacity ${capEnabled ? 'opacity-100' : 'pointer-events-none opacity-40'}`}
          >
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg text-ink/40 dark:text-white/40">₦</span>
              <input
                {...integerInputProps(amount, setAmount)}
                disabled={!capEnabled}
                className="w-full rounded-2xl bg-cream py-4 pl-9 pr-24 text-xl font-bold text-ink outline-none transition focus:ring-2 focus:ring-brand/20 dark:bg-white/5 dark:text-white"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-ink/40 dark:text-white/40">
                Max spend
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = Number(amount) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    disabled={!capEnabled}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-brand text-white shadow-soft'
                        : 'bg-cream text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
                    }`}
                  >
                    {formatNaira(preset)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={capEnabled ? { scale: 1.02 } : {}}
          whileTap={capEnabled ? { scale: 0.98 } : {}}
          type="submit"
          disabled={!capEnabled}
          className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold shadow-soft transition ${
            capEnabled
              ? 'cursor-pointer bg-brand text-white hover:bg-brand-dark'
              : 'cursor-not-allowed bg-ink/15 text-ink/35 shadow-none dark:bg-white/10 dark:text-white/35'
          }`}
        >
          Start browsing <ArrowRight size={16} />
        </motion.button>
        {!capEnabled && (
          <p className="text-center text-xs text-ink/40 dark:text-white/40">Check "Set a spending cap" above to continue.</p>
        )}
      </form>
    </div>
  );
}

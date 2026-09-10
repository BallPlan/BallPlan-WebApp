import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

const OPTIONS = [
  {
    id: 'ballplan',
    label: 'Let BallPlan plan a perfect outing with your budget',
    to: '/plan-outing/ballplan',
  },
  {
    id: 'yourself',
    label: 'Plan your outing yourself',
    to: '/plan-outing/yourself',
  },
];

export default function PlanOuting() {
  const [selected, setSelected] = useState('ballplan');
  const navigate = useNavigate();

  const handleContinue = () => {
    const option = OPTIONS.find((o) => o.id === selected);
    navigate(option.to);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center gap-3">
        <BackButton />
      </div>
      <h1 className="font-display text-3xl font-extrabold text-ink dark:text-white sm:text-4xl">Plan an outing</h1>
      <p className="mt-2 text-ink/55 dark:text-white/55">Let's help you plan your outing with your budget</p>

      <p className="mb-3 mt-8 text-sm font-semibold text-ink/70 dark:text-white/70">Pick one of the options</p>
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelected(opt.id)}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-sm font-semibold shadow-card transition-colors ${
                active ? 'bg-brand text-white' : 'bg-white text-brand hover:bg-brand/5 dark:bg-[#1c1c1e]'
              }`}
            >
              {opt.label}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? 'border-white' : 'border-brand/50'
                }`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleContinue}
        className="mt-8 w-full rounded-full bg-ink py-4 text-sm font-bold text-white shadow-card-hover transition hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/90"
      >
        Continue
      </motion.button>
    </div>
  );
}

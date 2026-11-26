import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

// First-visit intro for the main app:
//  1. a short "what is BallPlan" popup, then (optionally)
//  2. a guided tour that spotlights the real parts of the app, one at a
//     time, with a pointer bubble explaining each.
// Tour targets are elements tagged data-tour="<id>" (Header, Sidebar,
// BottomNav, Home). Where the same id exists twice (desktop sidebar vs
// mobile bottom bar), the visible one is used. Shown once per browser;
// skipping or finishing remembers it. The "?" in the header reopens it via
// window.dispatchEvent(new Event('ballplan:open-tour')).
const SEEN_KEY = 'ballplan:welcome-seen';

const STEPS = [
  {
    target: 'categories',
    title: 'Browse by category',
    text: 'Pick what you’re in the mood for: restaurants, lounges, beaches, cinemas and more across Lagos.',
  },
  {
    target: 'venue',
    title: 'Open a venue',
    text: 'Each card shows the cheapest “from” price. Tap one to see real menu prices, recent price changes and hidden fees like service charge and VAT. Spot a wrong price? Report it there.',
  },
  {
    target: 'search',
    title: 'Search',
    text: 'Looking for somewhere specific? Search by venue name, category or area, like Lekki or Victoria Island.',
  },
  {
    target: 'my-plan',
    title: 'My Plan',
    text: 'Tap “Add to plan” on anything you fancy. Your plan keeps a running total across venues, and you can save it or download it as a PDF.',
  },
  {
    target: 'plan-outing',
    title: 'Plan an outing',
    text: 'Give BallPlan your budget, group size, area and mood, and it suggests places that fit. Or plan it yourself with a spending cap that warns you before you go over.',
  },
  {
    target: 'favorites',
    title: 'Favorites',
    text: 'Tap the heart on venues you love to keep them here. You’ll be told when their prices drop.',
  },
  {
    target: 'notifications',
    title: 'Notifications',
    text: 'Price drops, new venues, and updates on prices you’ve reported all land here.',
  },
  {
    target: 'help',
    title: 'Need a refresher?',
    text: 'Tap here any time to take this tour again. Enjoy planning!',
  },
];

const PAD = 8; // space between the element and the spotlight edge
const GAP = 14; // space between the spotlight and the bubble
const EDGE = 12; // min distance from the screen edge

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode etc.: it just shows again next visit */
  }
}

// The first element tagged with this id that is actually on screen.
function findTarget(id) {
  return [...document.querySelectorAll(`[data-tour="${id}"]`)].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
}

export default function WelcomeTour() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState(null); // null | 'welcome' | 'tour'
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timer;
    if (!readSeen()) timer = setTimeout(() => setPhase('welcome'), 700);
    const reopen = () => setPhase('welcome');
    window.addEventListener('ballplan:open-tour', reopen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('ballplan:open-tour', reopen);
    };
  }, []);

  // No page scrolling by hand while the popup/tour is up (the tour still
  // scrolls things into view itself).
  useEffect(() => {
    if (!phase) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  const close = () => {
    markSeen();
    setPhase(null);
  };

  const startTour = () => {
    if (pathname !== '/') navigate('/');
    window.scrollTo({ top: 0 });
    setStep(0);
    setPhase('tour');
  };

  const go = (delta) => {
    const next = step + delta;
    if (next >= STEPS.length) close();
    else setStep(Math.max(0, next));
  };

  return (
    <>
      <AnimatePresence>{phase === 'welcome' && <WelcomePopup onTour={startTour} onSkip={close} />}</AnimatePresence>
      {phase === 'tour' && <Spotlight key="tour" step={step} onNext={() => go(1)} onBack={() => go(-1)} onSkip={close} />}
    </>
  );
}

function WelcomePopup({ onTour, onSkip }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onSkip();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/55 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onSkip}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to BallPlan"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-card-hover dark:bg-[#1c1c1e] sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onSkip}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink/60 backdrop-blur transition hover:bg-white hover:text-ink dark:bg-black/30 dark:text-white/70 dark:hover:text-white"
        >
          <X size={18} />
        </button>
        <div className="relative flex flex-col items-center bg-gradient-to-br from-brand via-brand to-brand-dark px-6 pb-8 pt-10 text-center text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <img src={logoIcon} alt="" className="h-9 w-auto" />
          </span>
          <h2 className="relative mt-4 font-display text-2xl font-bold">Welcome to BallPlan</h2>
          <p className="relative mt-1 text-sm text-white/85">Know the cost before you go.</p>
        </div>
        <div className="px-6 pb-6 pt-5">
          <p className="text-center text-[15px] leading-relaxed text-ink/70 dark:text-white/70">
            BallPlan shows you <span className="font-semibold text-ink dark:text-white">real prices</span> at restaurants, lounges,
            beaches, cinemas and more across Lagos, including the{' '}
            <span className="font-semibold text-ink dark:text-white">hidden fees</span>. Plan an outing that fits your budget
            before you leave home, with no surprises on the bill.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onTour}
              className="flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
            >
              <Sparkles size={16} /> Show me around
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full py-2.5 text-sm font-semibold text-ink/55 transition hover:bg-ink/5 hover:text-ink dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Skip, I’ll explore myself
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Spotlight({ step, onNext, onBack, onSkip }) {
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const [rect, setRect] = useState(null); // target's on-screen box
  const [missing, setMissing] = useState(false); // target not on this screen
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });
  const bubbleRef = useRef(null);
  const [bubbleH, setBubbleH] = useState(180);

  // Follow the target every frame (it can move while things load, scroll
  // or resize). If it never appears, the bubble shows centred instead.
  useEffect(() => {
    let raf;
    let scrolled = false;
    const started = performance.now();
    setRect(null);
    setMissing(false);
    const tick = () => {
      const el = findTarget(current.target);
      if (el) {
        let r = el.getBoundingClientRect();
        if (!scrolled) {
          scrolled = true;
          if (r.top < 70 || r.bottom > window.innerHeight - 110) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        r = el.getBoundingClientRect();
        setMissing(false);
        setRect((prev) =>
          prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        );
      } else if (performance.now() - started > 1800) {
        setMissing(true);
      }
      setView((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current.target]);

  useLayoutEffect(() => {
    if (bubbleRef.current) setBubbleH(bubbleRef.current.offsetHeight);
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft' && step > 0) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onBack, onSkip, step]);

  // Spotlight box and where the bubble goes (below the target if it fits,
  // otherwise above, otherwise pinned to the bottom of the screen).
  const spot = rect && !missing
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;
  const bubbleW = Math.min(340, view.w - EDGE * 2);
  let bubble;
  if (spot) {
    const below = view.h - (spot.top + spot.height) - GAP - EDGE;
    const above = spot.top - GAP - EDGE;
    const centerX = spot.left + spot.width / 2;
    const left = Math.min(Math.max(centerX - bubbleW / 2, EDGE), view.w - bubbleW - EDGE);
    const arrowX = Math.min(Math.max(centerX - left, 22), bubbleW - 22);
    if (below >= bubbleH) bubble = { top: spot.top + spot.height + GAP, left, arrow: 'up', arrowX };
    else if (above >= bubbleH) bubble = { top: spot.top - GAP - bubbleH, left, arrow: 'down', arrowX };
    else bubble = { top: view.h - bubbleH - EDGE, left, arrow: null, arrowX };
  } else {
    bubble = { top: (view.h - bubbleH) / 2, left: (view.w - bubbleW) / 2, arrow: null };
  }

  const ready = spot || missing;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={`BallPlan tour: ${current.title}`}>
      {/* Click shield: the page underneath can't be used mid-tour. */}
      <div className="absolute inset-0" />

      {/* Dimmed page with a hole around the target. */}
      {spot ? (
        <motion.div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-brand-light"
          style={{ boxShadow: '0 0 0 9999px rgba(18,18,18,0.62)' }}
          initial={false}
          animate={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        >
          <span className="absolute inset-0 animate-ping rounded-2xl ring-2 ring-brand-light/60 [animation-duration:1.8s]" />
        </motion.div>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-ink/60" />
      )}

      {/* Pointer bubble */}
      <motion.div
        ref={bubbleRef}
        className="absolute rounded-2xl bg-white p-5 shadow-card-hover dark:bg-[#1c1c1e]"
        style={{ width: bubbleW }}
        initial={false}
        animate={{ top: bubble.top, left: bubble.left, opacity: ready ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      >
        {bubble.arrow && (
          <span
            className={`absolute h-3.5 w-3.5 rotate-45 bg-white dark:bg-[#1c1c1e] ${bubble.arrow === 'up' ? '-top-1.5' : '-bottom-1.5'}`}
            style={{ left: bubble.arrowX - 7 }}
          />
        )}

        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              {step + 1} of {STEPS.length}
            </span>
            <button
              type="button"
              onClick={onSkip}
              className="-mr-1 rounded-full px-2 py-1 text-xs font-semibold text-ink/45 transition hover:bg-ink/5 hover:text-ink dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Skip tour
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <h3 className="mt-1.5 font-display text-lg font-bold text-ink dark:text-white">{current.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65 dark:text-white/65">{current.text}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-2">
            <div className="mr-auto flex gap-1">
              {STEPS.map((s, i) => (
                <span
                  key={s.target}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-brand' : 'w-1.5 bg-ink/15 dark:bg-white/15'}`}
                />
              ))}
            </div>
            {step > 0 && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.97]"
            >
              {last ? 'Start exploring' : 'Next'} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

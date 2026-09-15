import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Share2, Wallet, Compass, ShieldCheck, Loader2 } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { InstagramIcon, XIcon, LinkedinIcon } from '../components/SocialIcons';

const STORAGE_KEY = 'ballplan_waitlist';

const EXPECT_CARDS = [
  { icon: Wallet, title: 'Real Prices', body: 'Know the cost before you go.' },
  { icon: Compass, title: 'Plan Outings', body: 'Build your perfect day.' },
  { icon: ShieldCheck, title: 'No Surprises', body: 'Hidden fees exposed.' },
];

const QUOTES = [
  { name: 'Ada', place: 'Lagos', text: "Finally, a way to plan a night out without the budget surprises at the end." },
  { name: 'Tunde', place: 'Lekki', text: 'Been waiting for something like this. Signed up the second I heard.' },
  { name: 'Ifeoma', place: 'Ikeja', text: "The idea of knowing real prices before I even leave the house? Sold." },
];

const AVATAR_COLORS = ['bg-brand', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500'];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5, delay, ease: 'easeOut' },
  };
}

export default function Waitlist() {
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [position, setPosition] = useState(null);
  const [totalCount, setTotalCount] = useState(500);

  useEffect(() => {
    supabase.rpc('get_waitlist_count').then(({ data }) => {
      if (typeof data === 'number') setTotalCount(Math.max(500, data));
    });

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setEmail(saved.email || '');
        setPosition(saved.position ?? null);
        setJoined(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      notify('Enter a valid email address.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('waitlist').insert({ email: normalized });
      if (error && error.code !== '23505') throw error; // 23505 = already on the list, treat as success

      const { data: count } = await supabase.rpc('get_waitlist_count');
      const pos = 200 + (typeof count === 'number' ? count : 0);

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: normalized, position: pos }));
      } catch {
        // ignore
      }
      setPosition(pos);
      setJoined(true);
    } catch (err) {
      notify(err.message || 'Could not join the waitlist. Try again.', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/waitlist`;
    const shareData = {
      title: 'BallPlan',
      text: 'Join me on the BallPlan waitlist — plan smarter, stay on budget.',
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      notify('Link copied to clipboard!', 'success');
    } catch {
      notify('Could not copy the link.', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#121212]">
      {/* Hero + form / success */}
      <section className="mx-auto flex max-w-xl flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
        <motion.img
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
          src={logoIcon}
          alt="BallPlan"
          className="h-14 w-auto"
        />

        {!joined ? (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display mt-6 text-3xl font-extrabold text-ink dark:text-white sm:text-5xl"
            >
              Be the first to plan smarter.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-md text-base text-ink/60 dark:text-white/60"
            >
              Join the waitlist and get early access to BallPlan — the easiest way to plan your perfect outing and
              stay on budget.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSubmit}
              className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full flex-1 rounded-xl border border-ink/15 bg-white px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
              <motion.button
                whileHover={{ scale: submitting ? 1 : 1.03 }}
                whileTap={{ scale: submitting ? 1 : 0.97 }}
                type="submit"
                disabled={submitting}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Join Waitlist
              </motion.button>
            </motion.form>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-3 text-xs text-ink/40 dark:text-white/40"
            >
              No spam. Just early access.
            </motion.p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-8 w-full max-w-sm rounded-3xl bg-white p-8 shadow-card-hover dark:bg-[#1c1c1e]"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </span>
            <h2 className="font-display mt-5 text-2xl font-extrabold text-ink dark:text-white">You're on the list!</h2>
            <p className="mt-2 text-sm text-ink/55 dark:text-white/55">
              We'll notify you when BallPlan launches in your city.
            </p>
            {position != null && (
              <p className="mt-4 inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-bold text-brand">
                You're #{position} in line
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand py-3 text-sm font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              <Share2 size={15} /> Share with a friend
            </motion.button>
          </motion.div>
        )}
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <motion.div {...fadeUp()} className="rounded-3xl bg-white p-8 text-center shadow-card dark:bg-[#1c1c1e]">
          <div className="flex -space-x-3">
            <div className="mx-auto flex -space-x-3">
              {AVATAR_COLORS.map((color, i) => (
                <span
                  key={i}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white dark:border-[#1c1c1e] ${color}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm font-bold text-ink dark:text-white">
            Join {totalCount.toLocaleString()}+ others already waiting
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {QUOTES.map((q, i) => (
              <motion.div
                key={q.name}
                {...fadeUp(0.1 * i)}
                className="rounded-2xl bg-cream p-4 text-left dark:bg-white/5"
              >
                <p className="text-sm italic text-ink/70 dark:text-white/70">"{q.text}"</p>
                <p className="mt-2 text-xs font-semibold text-ink/50 dark:text-white/50">
                  {q.name}, {q.place}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* What to expect */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <motion.h2 {...fadeUp()} className="font-display text-center text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">
          What to expect
        </motion.h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {EXPECT_CARDS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              {...fadeUp(0.1 * i)}
              className="rounded-2xl bg-white p-6 text-center shadow-card dark:bg-[#1c1c1e]"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon size={22} />
              </span>
              <h3 className="font-display mt-4 text-lg font-bold text-ink dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/8 px-6 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoIcon} alt="" className="h-7 w-auto" />
            <span className="font-display text-base font-extrabold text-ink dark:text-white">BallPlan</span>
          </Link>
          <div className="flex items-center gap-4 text-ink/40 dark:text-white/40">
            <a href="#" aria-label="Instagram" className="transition hover:text-brand">
              <InstagramIcon size={18} />
            </a>
            <a href="#" aria-label="X (Twitter)" className="transition hover:text-brand">
              <XIcon size={18} />
            </a>
            <a href="#" aria-label="LinkedIn" className="transition hover:text-brand">
              <LinkedinIcon size={18} />
            </a>
          </div>
          <p className="text-xs text-ink/35 dark:text-white/35">&copy; {new Date().getFullYear()} BallPlan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

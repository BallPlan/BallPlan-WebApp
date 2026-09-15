import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Share2, Wallet, Compass, ShieldCheck, Star, Loader2, ArrowRight } from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { InstagramIcon, XIcon, LinkedinIcon } from '../components/SocialIcons';

const img = (id, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

// Same photo set already used for real venues elsewhere in the app —
// keeps the waitlist page visually consistent with the actual product.
const COLLAGE = [
  { src: img('photo-1517248135467-4c7edcad34c4'), className: 'col-span-2 row-span-2' },
  { src: img('photo-1519046904884-53103b34b206'), className: '' },
  { src: img('photo-1552566626-52f8b828add9'), className: '' },
  { src: img('photo-1551882547-ff40c63fe5fa'), className: 'col-span-2' },
];

const EXPECT_CARDS = [
  { icon: Wallet, title: 'Real Prices', body: 'Know the cost before you go.' },
  { icon: Compass, title: 'Plan Outings', body: 'Build your perfect day.' },
  { icon: ShieldCheck, title: 'No Surprises', body: 'Hidden fees exposed.' },
];

const QUOTES = [
  { name: 'Ada', place: 'Lagos', text: 'Finally a way to plan a night out without the budget surprises at the end.' },
  { name: 'Tunde', place: 'Lekki', text: 'Been waiting for something like this. Signed up the second I heard.' },
  { name: 'Ifeoma', place: 'Ikeja', text: 'Knowing real prices before I even leave the house? Sold.' },
];

const AVATAR_COLORS = ['bg-brand', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500'];

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

  // Deliberately not persisted across reloads — refreshing gives a clean
  // form again so someone can drop a second email (e.g. for a friend)
  // without the page assuming it's still them.
  useEffect(() => {
    supabase.rpc('get_waitlist_count').then(({ data }) => {
      if (typeof data === 'number') setTotalCount(Math.max(500, data));
    });
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
    const shareData = { title: 'BallPlan', text: 'Join me on the BallPlan waitlist — plan smarter, stay on budget.', url };
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
    <div className="relative min-h-screen overflow-hidden bg-cream dark:bg-[#121212]">

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="" className="h-8 w-auto" />
          <span className="font-display text-lg font-extrabold text-ink dark:text-white">BallPlan</span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-12">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            Launching soon
          </motion.span>

          {joined ? (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-6 rounded-3xl bg-white p-8 shadow-card-hover dark:bg-[#1c1c1e]"
            >
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/40" />
                <CheckCircle2 size={32} className="relative" />
              </span>
              <h1 className="font-display mt-5 text-3xl font-extrabold text-ink dark:text-white">You're on the list!</h1>
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
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand py-3 text-sm font-bold text-brand transition hover:bg-brand hover:text-white sm:w-auto sm:px-6"
              >
                <Share2 size={15} /> Share with a friend
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-display mt-5 text-4xl font-extrabold leading-[1.05] text-ink dark:text-white sm:text-5xl lg:text-6xl"
              >
                Be the first to plan <span className="text-brand">smarter.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 max-w-md text-base leading-relaxed text-ink/60 dark:text-white/60"
              >
                Join the waitlist and get early access to BallPlan — the easiest way to plan your perfect outing and
                stay on budget.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="mt-7 flex w-full max-w-md items-center gap-1.5 rounded-full bg-white p-1.5 shadow-card-hover ring-1 ring-ink/5 dark:bg-[#1c1c1e] dark:ring-white/10"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 dark:text-white dark:placeholder:text-white/40"
                />
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.03 }}
                  whileTap={{ scale: submitting ? 1 : 0.97 }}
                  type="submit"
                  disabled={submitting}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  <span className="hidden sm:inline">Join Waitlist</span>
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

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-7 flex items-center gap-3"
              >
                <div className="flex -space-x-2.5">
                  {AVATAR_COLORS.map((color, i) => (
                    <span
                      key={i}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-cream text-[11px] font-bold text-white dark:border-[#121212] ${color}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink/55 dark:text-white/55">
                  Join <span className="font-bold text-ink dark:text-white">{totalCount.toLocaleString()}+</span>{' '}
                  people already waiting
                </p>
              </motion.div>
            </>
          )}
        </div>

        {/* Photo collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="grid grid-cols-3 grid-rows-2 gap-3">
            {COLLAGE.map((tile, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl shadow-card ${tile.className || ''}`}
                style={{ aspectRatio: tile.className?.includes('row-span-2') ? '1/1' : '4/3' }}
              >
                <img src={tile.src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-card-hover dark:bg-[#1c1c1e]"
          >
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-ink dark:text-white">4.8</span>
            <span className="text-xs text-ink/40 dark:text-white/40">rated venues</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute -right-3 -top-3 rounded-2xl bg-ink px-4 py-2.5 text-white shadow-card-hover dark:bg-brand"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Budget</p>
            <p className="text-sm font-bold">₦20,000</p>
          </motion.div>
        </motion.div>
      </section>

      {/* What to expect */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 sm:px-10">
        <motion.h2 {...fadeUp()} className="font-display text-center text-2xl font-extrabold text-ink dark:text-white sm:text-3xl">
          What to expect
        </motion.h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {EXPECT_CARDS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              {...fadeUp(0.1 * i)}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-white p-6 text-center shadow-card transition-shadow hover:shadow-card-hover dark:bg-[#1c1c1e]"
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

      {/* Testimonials */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 sm:px-10">
        <motion.p {...fadeUp()} className="text-center text-sm font-bold uppercase tracking-wider text-brand">
          Word is already spreading
        </motion.p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.div key={q.name} {...fadeUp(0.1 * i)} className="rounded-2xl border border-ink/8 p-5 dark:border-white/10">
              <p className="font-display text-3xl leading-none text-brand/30">"</p>
              <p className="-mt-2 text-sm italic leading-relaxed text-ink/70 dark:text-white/70">{q.text}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {q.name[0]}
                </span>
                <p className="text-xs font-semibold text-ink/50 dark:text-white/50">
                  {q.name}, {q.place}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-ink/8 px-6 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="" className="h-6 w-auto" />
            <span className="font-display text-sm font-extrabold text-ink dark:text-white">BallPlan</span>
          </div>
          <div className="flex items-center gap-4 text-ink/40 dark:text-white/40">
            <a href="#" aria-label="Instagram" className="transition hover:text-brand">
              <InstagramIcon size={17} />
            </a>
            <a href="#" aria-label="X (Twitter)" className="transition hover:text-brand">
              <XIcon size={17} />
            </a>
            <a href="#" aria-label="LinkedIn" className="transition hover:text-brand">
              <LinkedinIcon size={17} />
            </a>
          </div>
          <p className="text-xs text-ink/35 dark:text-white/35">&copy; {new Date().getFullYear()} BallPlan</p>
        </div>
      </footer>
    </div>
  );
}

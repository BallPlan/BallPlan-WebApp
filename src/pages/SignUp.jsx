import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthShell from '../components/AuthShell';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    console.log('[auth] requesting sign-up code for', email);
    navigate('/verify', { state: { email, mode: 'signup' } });
  };

  return (
    <AuthShell
      title="Sign Up for BallPlan"
      footer={
        <>
          By proceeding, you agree to creating a BallPlan account subject to our{' '}
          <span className="underline">Terms of Service</span> and{' '}
          <span className="underline">Privacy Policy</span>.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@email.com"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
        >
          Continue with Email
        </motion.button>
      </form>
      <p className="mt-6 text-sm text-ink/60 dark:text-white/60">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-brand hover:text-brand-dark">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

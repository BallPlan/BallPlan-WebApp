import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);
  const { signUp } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!email.includes('@')) return;
    if (password.length < 6) {
      notify('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      notify('Passwords do not match.', 'warning');
      return;
    }

    setSending(true);
    try {
      await signUp(email.trim(), password);
      navigate('/verify', { state: { email: email.trim(), mode: 'signup' } });
    } catch (err) {
      notify(err.message || 'Could not create your account. Try again.', 'warning');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title="Sign Up for BallPlan"
      subtitle="Plan outings that actually fit your budget."
      background
      footer={
        <>
          By proceeding, you agree to creating a BallPlan account subject to our{' '}
          <Link to="/terms" className="underline hover:text-brand">Terms of Service</Link> and{' '}
          <Link to="/privacy" className="underline hover:text-brand">Privacy Policy</Link>.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="w-full rounded-xl border border-ink/15 bg-white py-3.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
        </div>
        <PasswordInput value={password} onChange={setPassword} placeholder="Create password" />
        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" />

        <motion.button
          whileHover={{ scale: sending ? 1 : 1.02 }}
          whileTap={{ scale: sending ? 1 : 0.98 }}
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
        >
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating account...
            </>
          ) : (
            'Continue'
          )}
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

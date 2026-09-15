import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@') || sending) return;
    setSending(true);
    try {
      await requestPasswordReset(email.trim());
      navigate('/verify', { state: { email: email.trim(), mode: 'recovery' } });
    } catch (err) {
      notify(err.message || 'Could not send a reset code. Try again.', 'warning');
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a code to reset your password."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="w-full rounded-xl border border-ink/15 bg-white py-3.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
        </div>

        <motion.button
          whileHover={{ scale: sending ? 1 : 1.02 }}
          whileTap={{ scale: sending ? 1 : 0.98 }}
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
        >
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending code...
            </>
          ) : (
            'Continue'
          )}
        </motion.button>
      </form>
      <p className="mt-6 text-sm text-ink/60 dark:text-white/60">
        Remembered your password?{' '}
        <Link to="/signin" className="font-semibold text-brand hover:text-brand-dark">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

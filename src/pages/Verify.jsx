import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyCode } = useAuth();
  const { notify } = useToast();

  const email = location.state?.email;
  const mode = location.state?.mode || 'signin';

  const [digits, setDigits] = useState(Array(6).fill(''));
  const [verifying, setVerifying] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/signin', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const complete = digits.every((d) => d !== '');

  useEffect(() => {
    if (!complete || verifying) return;
    let cancelled = false;
    setVerifying(true);

    verifyCode(email, digits.join(''))
      .then((user) => {
        if (cancelled) return;
        notify(`Welcome to BallPlan, ${(user.user_metadata?.name || email.split('@')[0])}!`, 'success');
        navigate('/');
      })
      .catch((err) => {
        if (cancelled) return;
        notify(err.message || 'That code is incorrect or has expired.', 'warning');
        setDigits(Array(6).fill(''));
        inputsRef.current[0]?.focus();
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const setDigit = (index, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    if (val && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      text.split('').forEach((c, i) => (next[i] = c));
      return next;
    });
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  if (!email) return null;

  return (
    <AuthShell
      title={mode === 'signup' ? 'Sign Up for BallPlan' : 'Sign In for BallPlan'}
      subtitle={mode === 'signup' ? 'Verify your email to finish creating your account.' : 'Sign in to BallPlan using your BallPlan account.'}
      footer={
        <>
          By proceeding, you agree to creating a BallPlan account subject to our{' '}
          <span className="underline">Terms of Service</span> and{' '}
          <span className="underline">Privacy Policy</span>.
        </>
      }
    >
      <p className="mb-6 text-sm text-ink/60 dark:text-white/60">
        If you have a BallPlan account, we sent a code to <span className="font-semibold text-ink dark:text-white">{email}</span>.
      </p>

      <div className="mb-6 flex justify-center gap-2.5" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            disabled={verifying}
            className="h-14 w-12 rounded-xl border border-ink/15 bg-white text-center text-lg font-bold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
        ))}
      </div>

      {verifying && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-brand">
          <Loader2 size={16} className="animate-spin" /> Verifying code...
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(mode === 'signup' ? '/signup' : '/signin')}
        className="w-full rounded-xl border border-brand/40 py-3.5 text-sm font-semibold text-brand transition hover:bg-brand/5"
      >
        Use a Different Email
      </button>

      <p className="mt-8 text-sm text-ink/60 dark:text-white/60">
        {mode === 'signup' ? (
          <>
            Already verified before?{' '}
            <button onClick={() => navigate('/signin')} className="font-semibold text-brand hover:text-brand-dark">
              try signing in instead.
            </button>
          </>
        ) : (
          <>
            Don't have an account yet? If you're still waiting on your code{' '}
            <button onClick={() => navigate('/signup')} className="font-semibold text-brand hover:text-brand-dark">
              try signing up instead.
            </button>
          </>
        )}
      </p>
    </AuthShell>
  );
}

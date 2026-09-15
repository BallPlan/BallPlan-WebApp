import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, loading, updatePassword, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  // This page only makes sense right after Verify establishes a recovery
  // session — without one there's nothing to reset. Skipped once we've
  // succeeded: logging out on submit also clears `user`, and without this
  // guard that would immediately redirect here instead of to /signin.
  useEffect(() => {
    if (!loading && !user && !success) {
      navigate('/forgot-password', { replace: true });
    }
  }, [loading, user, success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (password.length < 6) {
      notify('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      notify('Passwords do not match.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      await logout();
      notify('Password updated — sign in with your new password.', 'success');
      navigate('/signin');
    } catch (err) {
      notify(err.message || 'Could not update your password. Try again.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!user && !success)) return null;

  return (
    <AuthShell title="Reset Your Password" subtitle="Choose a new password for your BallPlan account.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput value={password} onChange={setPassword} placeholder="Create new password" autoFocus />
        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" />

        <motion.button
          whileHover={{ scale: saving ? 1 : 1.02 }}
          whileTap={{ scale: saving ? 1 : 0.98 }}
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            'Continue'
          )}
        </motion.button>
      </form>
    </AuthShell>
  );
}

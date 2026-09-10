import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logoIcon from '../../assets/logo-icon.png';
import { adminLogin, useAdminAuthStore, getAdminProfile, getAdminPassword } from '../../shared/store';

export default function AdminLogin() {
  const navigate = useNavigate();
  const auth = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth) navigate('/', { replace: true });
  }, [auth, navigate]);

  if (auth) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const validEmail = getAdminProfile().email.toLowerCase();
    const validPassword = getAdminPassword();
    if (email.trim().toLowerCase() === validEmail && password === validPassword) {
      adminLogin(email.trim().toLowerCase());
      navigate('/', { replace: true });
      return;
    }
    setError('Incorrect email or password.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4f2] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card-hover"
      >
        <div className="flex flex-col items-center text-center">
          <img src={logoIcon} alt="" className="h-12 w-auto" />
          <div className="mt-3 flex items-center gap-1.5 text-brand">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Admin Access</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-ink">BallPlan Admin</h1>
          <p className="mt-1 text-sm text-ink/50">Sign in to manage venues, users and reports.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink/50">Email</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@admin.com"
                className="w-full rounded-xl border border-ink/15 bg-cream py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink/50">Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full rounded-xl border border-ink/15 bg-cream py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink/35">
          Demo credentials: <span className="font-semibold text-ink/55">demo@admin.com</span> /{' '}
          <span className="font-semibold text-ink/55">admin123</span>
        </p>
      </motion.div>
    </div>
  );
}

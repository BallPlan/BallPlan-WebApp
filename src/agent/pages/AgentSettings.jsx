import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useAgentAuth } from '../context/AgentAuthContext';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50';

export default function AgentSettings() {
  const { user, updateOwnProfile } = useAgentAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.first_name || '', lastName: user.last_name || '' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      notify('First name and last name are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await updateOwnProfile({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      });
      notify('Profile updated.', 'success');
    } catch {
      notify('Could not update your profile.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Your agent profile information.</p>

      <div className="mt-5 max-w-lg rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
          <User size={15} className="text-brand" /> Profile Information
        </h2>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>First Name</span>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Last Name</span>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputCls}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelCls}>Email Address</span>
            <input value={user?.email || ''} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
          </label>
          <p className="text-xs text-ink/40 dark:text-white/40">
            Your email and password can only be changed by BallPlan admin or support — contact them if you need a
            password reset.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

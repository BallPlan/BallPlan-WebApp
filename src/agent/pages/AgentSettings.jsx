import { useEffect, useRef, useState } from 'react';
import { User, Camera, Trash2, Loader2 } from 'lucide-react';
import { useAgentAuth } from '../context/AgentAuthContext';
import { useToast } from '../../context/ToastContext';

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50';

export default function AgentSettings() {
  const { user, updateOwnProfile, uploadAvatar, removeAvatar } = useAgentAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) setForm({ firstName: user.first_name || '', lastName: user.last_name || '' });
  }, [user]);

  const initials = (`${form.firstName[0] || ''}${form.lastName[0] || ''}` || user?.email?.[0] || 'A').toUpperCase();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      await uploadAvatar(file);
      notify('Profile picture updated.', 'success');
    } catch (err) {
      notify(err.message || 'Could not upload your picture.', 'warning');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await removeAvatar();
      notify('Profile picture removed.', 'success');
    } catch (err) {
      notify(err.message || 'Could not remove your picture.', 'warning');
    } finally {
      setPhotoBusy(false);
    }
  };

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

        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Your profile" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
                {initials}
              </span>
            )}
            {photoBusy && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                <Loader2 size={20} className="animate-spin" />
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-brand/10 px-4 py-2 text-xs font-bold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
              >
                <Camera size={14} /> {user?.avatar_url ? 'Change picture' : 'Upload picture'}
              </button>
              {user?.avatar_url && (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-ink/40 dark:text-white/40">JPG, PNG or WebP. It's cropped to a square automatically.</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

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

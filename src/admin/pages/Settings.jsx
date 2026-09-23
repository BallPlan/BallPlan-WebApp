import { useEffect, useMemo, useState } from 'react';
import {
  User,
  ShieldCheck,
  Users as UsersIcon,
  LifeBuoy,
  Camera,
  Trash2,
  Ban,
  KeyRound,
  Copy,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionMenu from '../components/ActionMenu';
import { fileToDataUrl } from '../components/MediaInput';
import PasswordInput from '../../components/PasswordInput';
import { useAdminProfileStore, getAdminProfile, updateAdminProfile, getAdminPassword, setAdminPassword } from '../../shared/store';
import {
  useStaffStore,
  getAgents,
  getSupportStaff,
  createStaffAccount,
  toggleStaffStatus,
  deleteStaffAccount,
  resetStaffPassword,
} from '../lib/staffData';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'team', label: 'Agents', icon: UsersIcon },
  { id: 'support', label: 'Support', icon: LifeBuoy, ownerOnly: true },
];

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';
const labelCls = 'mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50';

function ProfileSection() {
  const { notify } = useToast();
  const profileSnapshot = useAdminProfileStore();
  const profile = useMemo(() => getAdminProfile(), [profileSnapshot]);
  const [form, setForm] = useState(profile);

  useEffect(() => setForm(profile), [profile]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, photo: dataUrl }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      notify('First name, last name and email are required.', 'warning');
      return;
    }
    updateAdminProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      photo: form.photo,
    });
    notify('Profile updated.', 'success');
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <h2 className="text-sm font-bold text-ink dark:text-white">Profile Information</h2>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Update your display name and photo.</p>

      <form onSubmit={handleSave} className="mt-5 space-y-4">
        <div className="flex items-center gap-4">
          {form.photo ? (
            <img src={form.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
              {(form.firstName?.[0] || 'A') + (form.lastName?.[0] || '')}
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand/10 px-4 py-2 text-xs font-bold text-brand transition hover:bg-brand hover:text-white">
            <Camera size={14} /> Change Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

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
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className={labelCls}>Role</span>
          <input value={form.role} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
        </label>

        <button
          type="submit"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

function SecuritySection() {
  const { notify } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    if (current !== getAdminPassword()) {
      notify('Current password is incorrect.', 'warning');
      return;
    }
    if (!next || next.length < 6) {
      notify('New password must be at least 6 characters.', 'warning');
      return;
    }
    if (next !== confirm) {
      notify('New password and confirmation do not match.', 'warning');
      return;
    }
    setAdminPassword(next);
    notify('Password updated.', 'success');
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
      <h2 className="text-sm font-bold text-ink dark:text-white">Change Password</h2>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Update your password to keep your account secure.</p>

      <form onSubmit={handleUpdate} className="mt-5 max-w-sm space-y-4">
        <label className="block">
          <span className={labelCls}>Current Password</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>New Password</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Confirm New Password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

const emptyStaffForm = { firstName: '', lastName: '', email: '', password: '' };

// Shared by the Team (agent) and Support tabs — identical shape, different
// role and copy. Both create real Supabase Auth accounts via Edge Functions.
function StaffSection({ role, roleLabel, emailPlaceholder }) {
  const { notify } = useToast();
  const staffSnapshot = useStaffStore();
  const staff = useMemo(() => (role === 'agent' ? getAgents() : getSupportStaff()), [staffSnapshot, role]);
  const [form, setForm] = useState(emptyStaffForm);
  const [creating, setCreating] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!form.firstName.trim() || !form.lastName.trim() || !email || !form.password) {
      notify('All fields are required.', 'warning');
      return;
    }
    if (!email.endsWith('@ballplan.net')) {
      notify(`${roleLabel} email must be a @ballplan.net address.`, 'warning');
      return;
    }
    if (form.password.length < 6) {
      notify('Password must be at least 6 characters.', 'warning');
      return;
    }
    setCreating(true);
    try {
      await createStaffAccount({
        role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        password: form.password,
      });
      notify(`${roleLabel} account created for ${email}.`, 'success');
      setForm(emptyStaffForm);
    } catch (err) {
      notify(err.message || `Could not create this ${roleLabel.toLowerCase()} account.`, 'warning');
    } finally {
      setCreating(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!suspendTarget) return;
    const nextStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    try {
      await toggleStaffStatus(suspendTarget.id, nextStatus);
      notify(`${suspendTarget.email} ${nextStatus === 'suspended' ? 'suspended' : 'reinstated'}.`, 'success');
    } catch {
      notify('Could not update this account.', 'warning');
    }
    setSuspendTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStaffAccount(deleteTarget.id);
      notify(`${roleLabel} account deleted.`, 'success');
    } catch (err) {
      notify(err.message || 'Could not delete this account.', 'warning');
    }
    setDeleteTarget(null);
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    try {
      const { tempPassword } = await resetStaffPassword(resetTarget.id);
      setTempPasswordModal({ email: resetTarget.email, tempPassword });
    } catch (err) {
      notify(err.message || 'Could not reset this password.', 'warning');
    }
    setResetTarget(null);
  };

  const copyTemp = () => {
    if (!tempPasswordModal) return;
    navigator.clipboard?.writeText(tempPasswordModal.tempPassword);
    notify('Temporary password copied.', 'info');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <h2 className="text-sm font-bold text-ink dark:text-white">Create {roleLabel} Account</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
          Give a {roleLabel.toLowerCase()} their own login. Email must be a @ballplan.net address.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
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
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder={emailPlaceholder}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Password</span>
            <PasswordInput value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
          >
            {creating ? 'Creating...' : `Create ${roleLabel} Account`}
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <h2 className="text-sm font-bold text-ink dark:text-white">{roleLabel} Team</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
          {staff.length} {roleLabel.toLowerCase()} account{staff.length === 1 ? '' : 's'}.
        </p>

        {staff.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40 dark:text-white/40">No {roleLabel.toLowerCase()} accounts yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-ink/5 dark:divide-white/5">
            {staff.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {person.first_name?.[0]}
                    {person.last_name?.[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink dark:text-white">
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="truncate text-xs text-ink/40 dark:text-white/40">{person.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      person.status === 'suspended'
                        ? 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                  >
                    {person.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                  <ActionMenu
                    items={[
                      {
                        label: person.status === 'suspended' ? 'Reinstate' : 'Suspend',
                        icon: Ban,
                        onClick: () => setSuspendTarget(person),
                      },
                      { label: 'Reset password', icon: KeyRound, onClick: () => setResetTarget(person) },
                      { divider: true },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(person) },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!suspendTarget}
        title={suspendTarget?.status === 'suspended' ? `Reinstate this ${roleLabel.toLowerCase()}?` : `Suspend this ${roleLabel.toLowerCase()}?`}
        description={`${suspendTarget?.email} will ${suspendTarget?.status === 'suspended' ? 'regain' : 'lose'} access to their dashboard.`}
        confirmLabel={suspendTarget?.status === 'suspended' ? 'Yes, reinstate' : 'Yes, suspend'}
        danger={suspendTarget?.status !== 'suspended'}
        onConfirm={handleSuspendToggle}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete this ${roleLabel.toLowerCase()} account?`}
        description={`"${deleteTarget?.email}" will be permanently removed.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!resetTarget}
        title={`Reset this ${roleLabel.toLowerCase()}'s password?`}
        description={`A new temporary password will be generated for ${resetTarget?.email}.`}
        confirmLabel="Yes, reset"
        danger={false}
        onConfirm={handleReset}
        onCancel={() => setResetTarget(null)}
      />

      <Modal open={!!tempPasswordModal} title="Password reset" onClose={() => setTempPasswordModal(null)}>
        <p className="text-sm text-ink/60 dark:text-white/60">
          New temporary password for <span className="font-semibold text-ink dark:text-white">{tempPasswordModal?.email}</span>:
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded-xl border border-ink/12 bg-cream px-3.5 py-2.5 text-sm font-bold text-ink dark:border-white/10 dark:bg-[#111217] dark:text-white">
            {tempPasswordModal?.tempPassword}
          </code>
          <button
            onClick={copyTemp}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
            aria-label="Copy password"
          >
            <Copy size={15} />
          </button>
        </div>
        <p className="mt-3 text-xs text-ink/40 dark:text-white/40">
          Share this with the {roleLabel.toLowerCase()} securely — it won't be shown again.
        </p>
      </Modal>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('profile');
  const { user } = useAdminAuth();
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || user?.role === 'owner');

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Manage your admin profile, security and team.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-brand text-white dark:bg-brand dark:text-white' : 'bg-white text-ink/50 shadow-card dark:bg-[#1a1b20] dark:text-white/50'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 max-w-2xl">
        {tab === 'profile' && <ProfileSection />}
        {tab === 'security' && <SecuritySection />}
        {tab === 'team' && <StaffSection role="agent" roleLabel="Agent" emailPlaceholder="agent@ballplan.net" />}
        {tab === 'support' && <StaffSection role="support" roleLabel="Support" emailPlaceholder="support@ballplan.net" />}
      </div>
    </div>
  );
}

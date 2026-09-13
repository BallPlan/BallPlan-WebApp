import { useEffect, useMemo, useState } from 'react';
import {
  User,
  ShieldCheck,
  Users as UsersIcon,
  Camera,
  Trash2,
  Ban,
  RotateCcw,
  KeyRound,
  Copy,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionMenu from '../components/ActionMenu';
import { fileToDataUrl } from '../components/MediaInput';
import {
  useAdminProfileStore,
  getAdminProfile,
  updateAdminProfile,
  getAdminPassword,
  setAdminPassword,
  useAgentsStore,
  getAgents,
  addAgent,
  updateAgent,
  deleteAgent,
  resetAgentPassword,
} from '../../shared/store';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'team', label: 'Team', icon: UsersIcon },
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

const emptyAgentForm = { firstName: '', lastName: '', email: '', password: '' };

function TeamSection() {
  const { notify } = useToast();
  const agentsSnapshot = useAgentsStore();
  const agents = useMemo(() => getAgents(), [agentsSnapshot]);
  const [form, setForm] = useState(emptyAgentForm);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [tempPasswordModal, setTempPasswordModal] = useState(null);

  const handleCreate = (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!form.firstName.trim() || !form.lastName.trim() || !email || !form.password) {
      notify('All fields are required.', 'warning');
      return;
    }
    if (!email.endsWith('@ballplan.net')) {
      notify('Agent email must be a @ballplan.net address.', 'warning');
      return;
    }
    if (agents.some((a) => a.email === email)) {
      notify('An agent with this email already exists.', 'warning');
      return;
    }
    addAgent({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email, password: form.password });
    notify(`Agent account created for ${email}.`, 'success');
    setForm(emptyAgentForm);
  };

  const handleSuspendToggle = () => {
    if (!suspendTarget) return;
    const nextStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    updateAgent(suspendTarget.id, { status: nextStatus });
    notify(`${suspendTarget.email} ${nextStatus === 'suspended' ? 'suspended' : 'reinstated'}.`, 'success');
    setSuspendTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAgent(deleteTarget.id);
    notify(`Agent account deleted.`, 'success');
    setDeleteTarget(null);
  };

  const handleReset = () => {
    if (!resetTarget) return;
    const tempPassword = resetAgentPassword(resetTarget.id);
    setTempPasswordModal({ email: resetTarget.email, tempPassword });
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
        <h2 className="text-sm font-bold text-ink dark:text-white">Create Venue Agent Account</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
          Give an agent their own login. Email must be a @ballplan.net address.
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
              placeholder="agent@ballplan.net"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Password</span>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Create agent Account
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
        <h2 className="text-sm font-bold text-ink dark:text-white">Customer Support Team</h2>
        <p className="mt-1 text-sm text-ink/50 dark:text-white/50">{agents.length} agent account(s).</p>

        {agents.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40 dark:text-white/40">No agent accounts yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-ink/5 dark:divide-white/5">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {agent.firstName[0]}
                    {agent.lastName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink dark:text-white">
                      {agent.firstName} {agent.lastName}
                    </p>
                    <p className="truncate text-xs text-ink/40 dark:text-white/40">{agent.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      agent.status === 'suspended'
                        ? 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                  >
                    {agent.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                  <ActionMenu
                    items={[
                      {
                        label: agent.status === 'suspended' ? 'Reinstate' : 'Suspend',
                        icon: Ban,
                        onClick: () => setSuspendTarget(agent),
                      },
                      { label: 'Reset password', icon: KeyRound, onClick: () => setResetTarget(agent) },
                      { divider: true },
                      { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(agent) },
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
        title={suspendTarget?.status === 'suspended' ? 'Reinstate this agent?' : 'Suspend this agent?'}
        description={`${suspendTarget?.email} will ${suspendTarget?.status === 'suspended' ? 'regain' : 'lose'} access to their agent dashboard.`}
        confirmLabel={suspendTarget?.status === 'suspended' ? 'Yes, reinstate' : 'Yes, suspend'}
        danger={suspendTarget?.status !== 'suspended'}
        onConfirm={handleSuspendToggle}
        onCancel={() => setSuspendTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this agent account?"
        description={`"${deleteTarget?.email}" will be permanently removed.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!resetTarget}
        title="Reset this agent's password?"
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
          Share this with the agent securely — it won't be shown again.
        </p>
      </Modal>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('profile');

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Manage your admin profile, security and team.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
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
        {tab === 'team' && <TeamSection />}
      </div>
    </div>
  );
}

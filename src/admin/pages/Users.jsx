import { useMemo, useState } from 'react';
import { Search, Users as UsersIcon, UserX, Eye, Ban, RotateCcw, Trash2 } from 'lucide-react';
import ActionMenu from '../components/ActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { useUsersStore, getUsers, updateUser, deleteUser } from '../../shared/store';
import { useToast } from '../../context/ToastContext';

export default function Users() {
  const [query, setQuery] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  const snapshot = useUsersStore();
  const users = useMemo(() => getUsers(), [snapshot]);
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  const filtered = useMemo(
    () => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query],
  );

  const toggleSuspend = (user) => {
    const next = user.status === 'active' ? 'suspended' : 'active';
    updateUser(user.id, { status: next });
    notify(`${user.email} ${next === 'active' ? 'reinstated' : 'suspended'}.`, next === 'active' ? 'success' : 'warning');
  };

  const handleDelete = () => {
    deleteUser(deleteTarget.id);
    notify(`${deleteTarget.email} was deleted.`, 'success');
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">Everyone with a BallPlan account.</p>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-56 rounded-full bg-white py-2.5 pl-9 pr-4 text-sm shadow-card outline-none focus:ring-2 focus:ring-brand/20 dark:bg-[#1a1b20] dark:text-white"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard label="Total Users" value={users.length} icon={UsersIcon} tone="brand" />
        <StatCard label="Suspended Users" value={suspendedCount} icon={UserX} tone="red" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
        <div className="hidden grid-cols-[2.5fr_1.2fr_0.8fr_0.6fr] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/40 dark:border-white/10 dark:text-white/40 lg:grid">
          <span>Email</span>
          <span>Joined</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-ink/5 dark:divide-white/5">
          {filtered.map((user) => (
            <div key={user.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[2.5fr_1.2fr_0.8fr_0.6fr] lg:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink dark:text-white">{user.email}</p>
                <p className="truncate text-xs text-ink/40 dark:text-white/40">{user.name}</p>
              </div>
              <span className="text-sm text-ink/60 dark:text-white/60">
                {new Date(user.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  user.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400'
                }`}
              >
                {user.status === 'active' ? 'Active' : 'Suspended'}
              </span>
              <div className="flex justify-end">
                <ActionMenu
                  items={[
                    { label: 'View profile', icon: Eye, onClick: () => setViewTarget(user) },
                    {
                      label: user.status === 'active' ? 'Suspend' : 'Reinstate',
                      icon: user.status === 'active' ? Ban : RotateCcw,
                      onClick: () => toggleSuspend(user),
                    },
                    { divider: true },
                    { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(user) },
                  ]}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">No users match your search.</p>}
        </div>
      </div>

      <Modal open={!!viewTarget} title="User profile" onClose={() => setViewTarget(null)}>
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
              {viewTarget.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-base font-bold text-ink dark:text-white">{viewTarget.name}</p>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-ink/5 p-3 dark:bg-white/5">
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Email</p>
                <p className="font-medium text-ink dark:text-white">{viewTarget.email}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Joined</p>
                <p className="font-medium text-ink dark:text-white">{new Date(viewTarget.joined).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Plans created</p>
                <p className="font-medium text-ink dark:text-white">{viewTarget.plans}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Reports submitted</p>
                <p className="font-medium text-ink dark:text-white">{viewTarget.reports}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this user?"
        description={`"${deleteTarget?.email}" will be permanently removed.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Search, Users as UsersIcon, UserX, Eye, Ban, RotateCcw, Trash2 } from 'lucide-react';
import ActionMenu from '../components/ActionMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

function displayName(row) {
  return row.name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email.split('@')[0];
}

export default function Users() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewCounts, setViewCounts] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { notify } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, first_name, last_name, status, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    if (error) {
      notify('Could not load users.', 'warning');
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewTarget) {
      setViewCounts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [plans, reports] = await Promise.all([
        supabase.from('plan_requests').select('id', { count: 'exact', head: true }).eq('user_id', viewTarget.id),
        supabase.from('price_reports').select('id', { count: 'exact', head: true }).eq('reported_by', viewTarget.id),
      ]);
      if (!cancelled) setViewCounts({ plans: plans.count ?? 0, reports: reports.count ?? 0 });
    })();
    return () => {
      cancelled = true;
    };
  }, [viewTarget]);

  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  const filtered = useMemo(
    () => users.filter((u) => `${displayName(u)} ${u.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query],
  );

  const toggleSuspend = async (user) => {
    const next = user.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', user.id);
    if (error) {
      notify('Could not update this user.', 'warning');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    notify(`${user.email} ${next === 'active' ? 'reinstated' : 'suspended'}.`, next === 'active' ? 'success' : 'warning');
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: target.id },
    });
    if (error || data?.error) {
      notify(data?.error || 'Could not delete this user.', 'warning');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    notify(`${target.email} was deleted.`, 'success');
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
          {loading && <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">Loading users...</p>}
          {!loading &&
            filtered.map((user) => (
              <div key={user.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[2.5fr_1.2fr_0.8fr_0.6fr] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink dark:text-white">{user.email}</p>
                  <p className="truncate text-xs text-ink/40 dark:text-white/40">{displayName(user)}</p>
                </div>
                <span className="text-sm text-ink/60 dark:text-white/60">
                  {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          {!loading && filtered.length === 0 && <p className="py-16 text-center text-sm text-ink/40 dark:text-white/40">No users match your search.</p>}
        </div>
      </div>

      <Modal open={!!viewTarget} title="User profile" onClose={() => setViewTarget(null)}>
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
              {displayName(viewTarget).slice(0, 2).toUpperCase()}
            </div>
            <p className="text-base font-bold text-ink dark:text-white">{displayName(viewTarget)}</p>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-ink/5 p-3 dark:bg-white/5">
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Email</p>
                <p className="font-medium text-ink dark:text-white">{viewTarget.email}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Joined</p>
                <p className="font-medium text-ink dark:text-white">{new Date(viewTarget.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Plans created</p>
                <p className="font-medium text-ink dark:text-white">{viewCounts ? viewCounts.plans : '...'}</p>
              </div>
              <div>
                <p className="text-xs text-ink/40 dark:text-white/40">Reports submitted</p>
                <p className="font-medium text-ink dark:text-white">{viewCounts ? viewCounts.reports : '...'}</p>
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

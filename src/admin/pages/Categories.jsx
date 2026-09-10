import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Tag, Tags, CheckCircle2, XCircle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ActionMenu from '../components/ActionMenu';
import StatCard from '../components/StatCard';
import {
  useCategoriesStore,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  venueCountForCategory,
  useVenuesStore,
} from '../../shared/store';
import { useToast } from '../../context/ToastContext';

const emptyForm = { name: '', singular: '', status: 'active' };

export default function Categories() {
  const { notify } = useToast();
  const categoriesSnapshot = useCategoriesStore();
  const venuesSnapshot = useVenuesStore();
  const categories = useMemo(() => getCategories(), [categoriesSnapshot]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, singular: cat.singular, status: cat.status });
    setFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify('Category name is required.', 'warning');
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name: form.name.trim(), singular: form.singular.trim() || form.name.trim(), status: form.status });
      notify(`"${form.name}" updated.`, 'success');
    } else {
      addCategory({ name: form.name.trim(), singular: form.singular.trim() || form.name.trim() });
      notify(`"${form.name}" created.`, 'success');
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    deleteCategory(deleteTarget.id);
    notify(`"${deleteTarget.name}" deleted.`, 'success');
    setDeleteTarget(null);
  };

  const toggleStatus = (cat) => {
    updateCategory(cat.id, { status: cat.status === 'active' ? 'inactive' : 'active' });
  };

  const activeCount = categories.filter((c) => c.status === 'active').length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-white">Categories</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-white/50">{categories.length} categories on BallPlan.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 lg:max-w-xl">
        <StatCard label="Total Categories" value={categories.length} icon={Tags} tone="brand" />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Inactive" value={inactiveCount} icon={XCircle} tone="red" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1a1b20]">
        <div className="hidden grid-cols-[2fr_1fr_1fr_0.6fr] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-bold uppercase tracking-wide text-ink/40 dark:border-white/10 dark:text-white/40 lg:grid">
          <span>Category name</span>
          <span>Venue count</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-ink/5 dark:divide-white/5">
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 lg:grid-cols-[2fr_1fr_1fr_0.6fr] lg:items-center">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Tag size={14} />
                </span>
                <p className="font-bold text-ink dark:text-white">{cat.name}</p>
              </div>
              <span className="text-sm text-ink/60 dark:text-white/60">{venueCountForCategory(cat.name)} venues</span>
              <button
                onClick={() => toggleStatus(cat)}
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  cat.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-white/50'
                }`}
              >
                {cat.status === 'active' ? 'Active' : 'Inactive'}
              </button>
              <div className="flex justify-end">
                <ActionMenu
                  items={[
                    { label: 'Edit', icon: Pencil, onClick: () => openEdit(cat) },
                    { divider: true },
                    { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(cat) },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={formOpen} title={editing ? 'Edit category' : 'Add category'} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Category name (plural)</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Rooftop Bars"
              className="w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">Singular label</span>
            <input
              value={form.singular}
              onChange={(e) => setForm((f) => ({ ...f, singular: e.target.value }))}
              placeholder="e.g. Rooftop Bar"
              className="w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
          >
            {editing ? 'Save changes' : 'Add category'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this category?"
        description={`"${deleteTarget?.name}" will be removed. Venues keep their existing tag.`}
        confirmLabel="Yes, delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

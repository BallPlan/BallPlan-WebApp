import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, ImagePlus, Save } from 'lucide-react';
import {
  getVenueById,
  addVenue,
  updateVenue,
  useCategoriesStore,
  getCategories,
} from '../lib/venuesData';
import { useToast } from '../../context/ToastContext';
import { integerInputProps } from '../../utils/integerInput';
import { formatNaira } from '../../utils/currency';
import MediaInput from '../components/MediaInput';

const emptyVenue = {
  name: '',
  tab: '',
  category: '',
  location: '',
  address: '',
  phone: '',
  rating: '4.5',
  openTime: '9:00 AM',
  closeTime: '10:00 PM',
  description: '',
  fromPrice: '',
  hero: '',
  gallery: [],
  hasVideo: false,
  hasMenu: true,
  hasActivities: false,
  menu: [],
  activities: [],
  hiddenFees: [],
  published: true,
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';

function ItemRows({ title, items, onChange, priceLabel = 'Price' }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...items, { id: `new-${Date.now()}`, name: '', image: '', price: '', desc: '' }]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink dark:text-white">{title}</h3>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
        >
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {items.length === 0 && <p className="text-xs text-ink/35 dark:text-white/35">Nothing added yet.</p>}
        {items.map((item, i) => (
          <div key={item.id || i} className="rounded-xl border border-ink/10 p-3 dark:border-white/10">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_1fr]">
              <input
                value={item.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Name"
                className={inputCls}
              />
              <input
                {...integerInputProps(String(item.price ?? ''), (v) => update(i, { price: v }))}
                placeholder={`${priceLabel} (₦)`}
                className={inputCls}
              />
            </div>
            <div className="mt-2">
              <MediaInput value={item.image} onChange={(v) => update(i, { image: v })} placeholder="Image URL" />
            </div>
            <textarea
              value={item.desc || ''}
              onChange={(e) => update(i, { desc: e.target.value })}
              placeholder="Short description (optional)"
              rows={2}
              className={`${inputCls} mt-2 resize-none`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VenueForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { notify } = useToast();
  const categoriesSnapshot = useCategoriesStore();
  const categories = useMemo(() => getCategories(), [categoriesSnapshot]);

  const [venue, setVenue] = useState(emptyVenue);

  useEffect(() => {
    if (isEdit) {
      const existing = getVenueById(id);
      if (existing) {
        setVenue({
          ...emptyVenue,
          ...existing,
          rating: String(existing.rating),
          fromPrice: String(existing.fromPrice),
        });
      }
    }
  }, [id, isEdit]);

  const set = (patch) => setVenue((v) => ({ ...v, ...patch }));

  // "From price" is always the cheapest menu/activity item, computed live —
  // never hand-typed, so it can't drift from what's actually on the menu.
  const cheapestItemPrice = useMemo(() => {
    const prices = [...venue.menu, ...venue.activities].map((i) => Number(i.price) || 0).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [venue.menu, venue.activities]);

  const handleCategoryChange = (name) => {
    const cat = categories.find((c) => c.name === name);
    set({ tab: name, category: cat?.singular || name });
  };

  const handleGalleryChange = (index, value) => {
    const gallery = [...venue.gallery];
    gallery[index] = value;
    set({ gallery });
  };
  const addGalleryUrl = () => set({ gallery: [...venue.gallery, ''] });
  const removeGalleryUrl = (i) => set({ gallery: venue.gallery.filter((_, idx) => idx !== i) });

  const updateFee = (i, patch) => set({ hiddenFees: venue.hiddenFees.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  const addFee = () => set({ hiddenFees: [...venue.hiddenFees, { label: '', amount: '' }] });
  const removeFee = (i) => set({ hiddenFees: venue.hiddenFees.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!venue.name.trim() || !venue.tab) {
      notify('Name and category are required.', 'warning');
      return;
    }
    const payload = {
      ...venue,
      rating: Number(venue.rating) || 0,
      fromPrice: Number(venue.fromPrice) || 0,
      gallery: venue.gallery.filter(Boolean),
      hero: venue.hero || venue.gallery[0] || '',
      menu: venue.menu.map((m) => ({ ...m, price: Number(m.price) || 0 })),
      activities: venue.activities.map((a) => ({ ...a, price: Number(a.price) || 0 })),
      hiddenFees: venue.hiddenFees
        .filter((f) => f.label)
        .map((f) => ({ label: f.label, amount: Number(f.amount) || 0 })),
    };

    try {
      if (isEdit) {
        await updateVenue(id, payload);
        notify(`${payload.name} updated.`, 'success');
      } else {
        await addVenue(payload);
        notify(`${payload.name} added.`, 'success');
      }
      navigate('/venues');
    } catch {
      notify('Could not save this venue. Please try again.', 'warning');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/venues"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card transition hover:bg-brand hover:text-white dark:bg-[#1a1b20]"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-extrabold text-ink dark:text-white">{isEdit ? 'Edit Venue' : 'Add Venue'}</h1>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Basic info</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Venue name">
              <input value={venue.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="Category">
              <select value={venue.tab} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls} required>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From price (₦)">
              <div className={`${inputCls} flex cursor-not-allowed items-center opacity-70`}>
                {cheapestItemPrice != null ? formatNaira(cheapestItemPrice) : 'Add a menu/activity item below'}
              </div>
            </Field>
            <Field label="Rating (0–5)">
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={venue.rating}
                onChange={(e) => set({ rating: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Open time">
              <input value={venue.openTime} onChange={(e) => set({ openTime: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Close time">
              <input value={venue.closeTime} onChange={(e) => set({ closeTime: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={venue.description || ''}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className={`${inputCls} mt-4 resize-none`}
            />
          </Field>
          <div className="mt-4 flex flex-wrap gap-5">
            {[
              ['hasMenu', 'Has menu'],
              ['hasActivities', 'Has activities'],
              ['hasVideo', 'Has video'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium text-ink/70 dark:text-white/70">
                <input type="checkbox" checked={venue[key]} onChange={(e) => set({ [key]: e.target.checked })} className="h-4 w-4 accent-brand" />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Location (short)">
              <input value={venue.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} placeholder="Ikeja, Lagos" />
            </Field>
            <Field label="Full address">
              <input value={venue.address} onChange={(e) => set({ address: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={venue.phone || ''} onChange={(e) => set({ phone: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Media</h2>
            <button
              type="button"
              onClick={addGalleryUrl}
              className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              <ImagePlus size={13} /> Add photo/video
            </button>
          </div>
          <Field label="Hero photo or video">
            <div className="mt-1">
              <MediaInput value={venue.hero} onChange={(v) => set({ hero: v })} placeholder="Hero image or video URL" />
            </div>
          </Field>
          <div className="mt-3 space-y-2">
            {venue.gallery.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <MediaInput value={url} onChange={(v) => handleGalleryChange(i, v)} placeholder="Gallery image or video URL" />
                </div>
                <button type="button" onClick={() => removeGalleryUrl(i)} className="shrink-0 text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <ItemRows title="Menu items" items={venue.menu} onChange={(menu) => set({ menu })} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <ItemRows title="Activities" items={venue.activities} onChange={(activities) => set({ activities })} priceLabel="Price" />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Hidden fees</h2>
            <button
              type="button"
              onClick={addFee}
              className="flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              <Plus size={13} /> Add fee
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {venue.hiddenFees.map((fee, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={fee.label} onChange={(e) => updateFee(i, { label: e.target.value })} placeholder="Fee label" className={inputCls} />
                <input
                  {...integerInputProps(String(fee.amount ?? ''), (v) => updateFee(i, { amount: v }))}
                  placeholder="Amount (₦)"
                  className={`${inputCls} max-w-[160px]`}
                />
                <button type="button" onClick={() => removeFee(i)} className="shrink-0 text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {venue.hiddenFees.length === 0 && <p className="text-xs text-ink/35 dark:text-white/35">No hidden fees added.</p>}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end gap-3 rounded-2xl bg-white/90 p-4 shadow-card-hover backdrop-blur dark:bg-[#1a1b20]/90">
        <Link
          to="/venues"
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-white/70"
        >
          Cancel
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark"
        >
          <Save size={16} /> {isEdit ? 'Save changes' : 'Add venue'}
        </motion.button>
      </div>
    </form>
  );
}

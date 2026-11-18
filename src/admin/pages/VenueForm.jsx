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
import NigeriaPhoneInput from '../../components/NigeriaPhoneInput';
import { NIGERIA_STATES, splitLocation, joinLocation } from '../../utils/nigeriaStates';
import { to24Hour, to12Hour } from '../../utils/timeFormat';
import MediaInput from '../components/MediaInput';
import { supabase } from '../lib/supabaseClient';
import { sectionNames } from '../../utils/itemSections';
import { validateVenue } from '../lib/venueValidation';

const emptyVenue = {
  name: '',
  tab: '',
  category: '',
  location: '',
  state: 'Lagos',
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

// Red note under a field that failed the required-field check on Save.
function FieldError({ msg }) {
  return msg ? <p className="mt-1 text-xs font-semibold text-red-500">{msg}</p> : null;
}

function Field({ label, children, error, required = false }) {
  return (
    <label className="block" data-invalid={error ? '' : undefined}>
      <span className="mb-1.5 block text-xs font-semibold text-ink/50 dark:text-white/50">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      <FieldError msg={error} />
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10 dark:bg-[#111217] dark:text-white';

// Red outline for an input that failed the required-field check.
const inv = (error) => (error ? ' border-red-400 ring-2 ring-red-400/20 dark:border-red-500' : '');

function ItemRows({ title, items, onChange, priceLabel = 'Price', suggestedSections = [], addLabel = 'Add', errors = {}, listError }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  // Category suggestions: whatever this list already uses, plus defaults.
  const listId = `sections-${title.replace(/\W+/g, '-').toLowerCase()}`;
  const sectionOptions = [...new Set([...sectionNames(items), ...suggestedSections])];
  const add = () =>
    onChange([...items, { id: `new-${Date.now()}`, name: '', image: '', price: '', desc: '', section: items[items.length - 1]?.section || '' }]);

  return (
    <div>
      <h3 className="text-sm font-bold text-ink dark:text-white">{title}</h3>
      <datalist id={listId}>
        {sectionOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div className="mt-3 space-y-3">
        {items.length === 0 && <p className="text-xs text-ink/35 dark:text-white/35">Nothing added yet.</p>}
        {items.map((item, i) => {
          const e = errors[i] || {};
          return (
          <div
            key={item.id || i}
            data-invalid={Object.keys(e).length ? '' : undefined}
            className={`rounded-xl border p-3 ${
              Object.keys(e).length ? 'border-red-300 bg-red-50/40 dark:border-red-500/50 dark:bg-red-500/5' : 'border-ink/10 dark:border-white/10'
            }`}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_1fr]">
              <input
                value={item.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Name *"
                className={`${inputCls}${inv(e.name)}`}
              />
              <input
                {...integerInputProps(String(item.price ?? ''), (v) => update(i, { price: v }))}
                placeholder={`${priceLabel} (₦) *`}
                className={`${inputCls}${inv(e.price)}`}
              />
            </div>
            <FieldError msg={[e.name, e.price].filter(Boolean).join(' · ')} />
            <div className="mt-2">
              <input
                value={item.section || ''}
                onChange={(e) => update(i, { section: e.target.value })}
                list={listId}
                placeholder="Category * (e.g. Food, Drinks, Desserts)"
                aria-label="Category"
                className={`${inputCls}${inv(e.section)}`}
              />
              <FieldError msg={e.section} />
            </div>
            <div className="mt-2">
              <MediaInput
                client={supabase}
                value={item.image}
                onChange={(v) => update(i, { image: v })}
                placeholder="Image URL *"
                accept="image/*"
                invalid={!!e.image}
              />
              <FieldError msg={e.image} />
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
          );
        })}
      </div>
      {listError && (
        <p data-invalid="" className="mt-2 text-xs font-semibold text-red-500">
          {listError}
        </p>
      )}
      <button
        type="button"
        onClick={add}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand/30 py-2.5 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand/5 dark:border-brand/40 dark:hover:bg-brand/10"
      >
        <Plus size={15} /> {addLabel}
      </button>
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
  // Turned on by a Save attempt with required fields missing; each
  // highlight clears as soon as that field is filled in.
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const existing = getVenueById(id);
      if (existing) {
        const { area, state } = splitLocation(existing.location);
        setVenue({
          ...emptyVenue,
          ...existing,
          location: area,
          state,
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

  const validation = useMemo(() => validateVenue(venue), [venue]);
  const err = showErrors ? validation.errors : { gallery: {}, menu: {}, activities: {}, fees: {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.valid) {
      setShowErrors(true);
      const { summary } = validation;
      const shown = summary.slice(0, 5).join('; ');
      notify(
        `Please complete the highlighted fields: ${shown}${summary.length > 5 ? ` and ${summary.length - 5} more` : ''}.`,
        'warning',
        7000,
      );
      requestAnimationFrame(() =>
        document.querySelector('[data-invalid]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }

    const payload = {
      ...venue,
      location: joinLocation(venue.location, venue.state),
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
            <Field label="Venue name" required error={err.name}>
              <input value={venue.name} onChange={(e) => set({ name: e.target.value })} className={`${inputCls}${inv(err.name)}`} />
            </Field>
            <Field label="Category" required error={err.tab}>
              <select value={venue.tab} onChange={(e) => handleCategoryChange(e.target.value)} className={`${inputCls}${inv(err.tab)}`}>
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
            <Field label="Rating (0–5)" required error={err.rating}>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={venue.rating}
                onChange={(e) => set({ rating: e.target.value })}
                className={`${inputCls}${inv(err.rating)}`}
              />
            </Field>
            <Field label="Open time" required error={err.openTime}>
              <input type="time" value={to24Hour(venue.openTime)} onChange={(e) => set({ openTime: to12Hour(e.target.value) })} className={`${inputCls}${inv(err.openTime)}`} />
            </Field>
            <Field label="Close time" required error={err.closeTime}>
              <input type="time" value={to24Hour(venue.closeTime)} onChange={(e) => set({ closeTime: to12Hour(e.target.value) })} className={`${inputCls}${inv(err.closeTime)}`} />
            </Field>
          </div>
          <div className="mt-4" />
          <Field label="Description" required error={err.description}>
            <textarea
              value={venue.description || ''}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none${inv(err.description)}`}
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
          {err.kinds && (
            <p data-invalid="" className="mt-2 text-xs font-semibold text-red-500">
              {err.kinds}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Area" required error={err.location}>
              <input value={venue.location} onChange={(e) => set({ location: e.target.value })} className={`${inputCls}${inv(err.location)}`} placeholder="Ikeja" />
            </Field>
            <Field label="State" required>
              <select value={venue.state} onChange={(e) => set({ state: e.target.value })} className={inputCls}>
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'Abuja' ? 'FCT (Abuja)' : s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Full address" required error={err.address}>
              <input value={venue.address} onChange={(e) => set({ address: e.target.value })} className={`${inputCls}${inv(err.address)}`} />
            </Field>
            <Field label="Phone" required error={err.phone}>
              <div className={err.phone ? 'rounded-xl ring-2 ring-red-400/60' : ''}>
                <NigeriaPhoneInput value={venue.phone} onChange={(v) => set({ phone: v })} />
              </div>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Media</h2>
          <Field label="Hero photo or video" required>
            <div className="mt-1">
              <div data-invalid={err.hero ? '' : undefined}>
                <MediaInput
                  client={supabase}
                  value={venue.hero}
                  onChange={(v) => set({ hero: v })}
                  placeholder="Hero image or video URL"
                  invalid={!!err.hero}
                />
                <FieldError msg={err.hero} />
              </div>
            </div>
          </Field>
          <div className="mt-3 space-y-2">
            {venue.gallery.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <div data-invalid={err.gallery[i] ? '' : undefined}>
                    <MediaInput
                      client={supabase}
                      value={url}
                      onChange={(v) => handleGalleryChange(i, v)}
                      placeholder="Gallery image or video URL"
                      invalid={!!err.gallery[i]}
                    />
                    <FieldError msg={err.gallery[i]} />
                  </div>
                </div>
                <button type="button" onClick={() => removeGalleryUrl(i)} className="shrink-0 text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addGalleryUrl}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand/30 py-2.5 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand/5 dark:border-brand/40 dark:hover:bg-brand/10"
          >
            <ImagePlus size={15} /> Add photo/video
          </button>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <ItemRows title="Menu items" items={venue.menu} onChange={(menu) => set({ menu })} suggestedSections={['Food', 'Drinks']} addLabel="Add menu item" errors={err.menu} listError={err.menuList} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <ItemRows title="Activities" items={venue.activities} onChange={(activities) => set({ activities })} priceLabel="Price" addLabel="Add activity" errors={err.activities} listError={err.activitiesList} />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-[#1a1b20]">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/40 dark:text-white/40">Hidden fees</h2>
          <div className="mt-3 space-y-2">
            {venue.hiddenFees.map((fee, i) => {
              const fe = err.fees[i] || {};
              return (
                <div key={i} data-invalid={fe.label || fe.amount ? '' : undefined}>
                  <div className="flex items-center gap-2">
                    <input
                      value={fee.label}
                      onChange={(e) => updateFee(i, { label: e.target.value })}
                      placeholder="Fee label *"
                      className={`${inputCls}${inv(fe.label)}`}
                    />
                    <input
                      {...integerInputProps(String(fee.amount ?? ''), (v) => updateFee(i, { amount: v }))}
                      placeholder="Amount (₦) *"
                      className={`${inputCls} max-w-[160px]${inv(fe.amount)}`}
                    />
                    <button type="button" onClick={() => removeFee(i)} className="shrink-0 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <FieldError msg={[fe.label, fe.amount].filter(Boolean).join(' · ')} />
                </div>
              );
            })}
            {venue.hiddenFees.length === 0 && <p className="text-xs text-ink/35 dark:text-white/35">No hidden fees added.</p>}
          </div>
          <button
            type="button"
            onClick={addFee}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-brand/30 py-2.5 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand/5 dark:border-brand/40 dark:hover:bg-brand/10"
          >
            <Plus size={15} /> Add fee
          </button>
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

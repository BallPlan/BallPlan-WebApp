import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, MapPin, Tag, Store, Download, Loader2, Bookmark, Save } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import QuantityStepper from '../components/QuantityStepper';
import EmptyCart from '../components/EmptyCart';
import BackButton from '../components/BackButton';
import SavedPlansModal from '../components/SavedPlansModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/currency';
import { downloadPlanPdf } from '../utils/generatePlanPdf';
import { supabase } from '../lib/supabaseClient';

const GROUPINGS = [
  { key: 'venueName', label: 'Venue', icon: Store },
  { key: 'category', label: 'Category', icon: Tag },
  { key: 'location', label: 'Location', icon: MapPin },
];

export default function ViewPlan() {
  const { items, updateQty, removeItem, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState('venueName');
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlansOpen, setSavedPlansOpen] = useState(false);

  const sections = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = item[groupBy] || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).map(([key, sectionItems]) => ({
      key,
      items: sectionItems,
      subtotal: sectionItems.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
      count: sectionItems.reduce((sum, i) => sum + i.qty, 0),
    }));
  }, [items, groupBy]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPlanPdf({
        sections,
        groupLabel: GROUPINGS.find((g) => g.key === groupBy).label,
        totalItems,
        totalPrice,
        preparedFor: user?.email,
      });
      console.log('[view-plan] downloaded PDF plan with', totalItems, 'items');
      notify('Your plan has been downloaded.', 'success');
    } catch (err) {
      console.error('[view-plan] failed to generate PDF', err);
      notify('Could not generate your PDF. Please try again.', 'warning');
    } finally {
      setDownloading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user) {
      notify('Sign in to save your plan.', 'warning');
      navigate('/signin');
      return;
    }
    setSaving(true);
    const uniqueVenues = Array.from(new Set(items.map((i) => i.venueName)));
    const name = uniqueVenues.length <= 2 ? uniqueVenues.join(' & ') : `${uniqueVenues[0]} + ${uniqueVenues.length - 1} more`;
    const { error } = await supabase.from('saved_plans').insert({
      user_id: user.id,
      name,
      items,
      item_count: totalItems,
      total_price: totalPrice,
    });
    setSaving(false);
    if (error) {
      notify('Could not save your plan.', 'warning');
      return;
    }
    notify('Plan saved — find it via the bookmark icon.', 'success');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-display text-2xl font-extrabold text-ink dark:text-white">Your Plan</h1>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card dark:bg-[#1c1c1e]">
              {GROUPINGS.map(({ key, label, icon: Icon }) => {
                const active = groupBy === key;
                return (
                  <button
                    key={key}
                    onClick={() => setGroupBy(key)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-brand text-white dark:bg-brand dark:text-white'
                        : 'text-ink/50 hover:text-ink dark:text-white/50 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setSavedPlansOpen(true)}
            aria-label="Saved plans"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-card transition hover:bg-brand hover:text-white dark:bg-[#1c1c1e]"
          >
            <Bookmark size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink/45 dark:text-white/45">
            Grouped by {GROUPINGS.find((g) => g.key === groupBy).label.toLowerCase()} — handy when a plan spans more
            than one place.
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={groupBy}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {sections.map((section) => (
                <div key={section.key} className="overflow-hidden rounded-2xl bg-white shadow-card dark:bg-[#1c1c1e]">
                  <div className="flex items-center justify-between bg-cream/70 px-4 py-3 dark:bg-white/5">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand">
                        {(() => {
                          const Icon = GROUPINGS.find((g) => g.key === groupBy).icon;
                          return <Icon size={13} />;
                        })()}
                      </span>
                      {section.key}
                      <span className="font-normal text-ink/40 dark:text-white/40">
                        · {section.count} item{section.count === 1 ? '' : 's'}
                      </span>
                    </h2>
                    <span className="text-sm font-extrabold text-brand">{formatNaira(section.subtotal)}</span>
                  </div>

                  <div className="divide-y divide-ink/5 dark:divide-white/10">
                    <AnimatePresence>
                      {section.items.map((item) => (
                        <motion.div
                          key={item.key}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: 30 }}
                          className="flex items-center gap-4 p-4"
                        >
                          <ImageWithFallback
                            src={item.image}
                            seed={item.key}
                            alt={item.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-ink dark:text-white">{item.name}</p>
                            <p className="mb-2 truncate text-xs text-ink/40 dark:text-white/40">
                              {item.venueName} · {item.location}
                            </p>
                            <QuantityStepper value={item.qty} onChange={(v) => updateQty(item.key, v)} min={1} size="sm" />
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-3">
                            <span className="font-bold text-brand">{formatNaira(item.unitPrice * item.qty)}</span>
                            <button
                              onClick={() => removeItem(item.key)}
                              className="text-ink/30 transition hover:scale-110 hover:text-red-500 dark:text-white/30"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="sticky bottom-24 mt-8 rounded-2xl bg-cream/95 pt-5 backdrop-blur dark:bg-[#121212]/95 lg:static lg:bottom-0 lg:bg-transparent">
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-4 dark:border-white/10">
              <p className="text-lg font-extrabold text-ink dark:text-white">Plan Total - {totalItems} items</p>
              <span className="text-2xl font-extrabold text-brand">{formatNaira(totalPrice)}</span>
            </div>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <motion.button
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                onClick={handleSavePlan}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-brand py-3.5 text-sm font-bold text-brand transition hover:bg-brand hover:text-white disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Plan
              </motion.button>
              <motion.button
                whileHover={{ scale: downloading ? 1 : 1.02 }}
                whileTap={{ scale: downloading ? 1 : 0.98 }}
                onClick={handleDownload}
                disabled={downloading}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-70"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparing...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download plan
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}

      <SavedPlansModal open={savedPlansOpen} onClose={() => setSavedPlansOpen(false)} />
    </div>
  );
}

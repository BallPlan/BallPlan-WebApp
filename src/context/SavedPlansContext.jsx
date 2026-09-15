import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../utils/useLocalStorage';

const SavedPlansContext = createContext(null);

function planName(items) {
  const uniqueVenues = Array.from(new Set(items.map((i) => i.venueName)));
  return uniqueVenues.length <= 2 ? uniqueVenues.join(' & ') : `${uniqueVenues[0]} + ${uniqueVenues.length - 1} more`;
}

export function SavedPlansProvider({ children }) {
  const { user } = useAuth();
  // Guests can save plans too — kept locally until they have an account.
  const [guestPlans, setGuestPlans] = useLocalStorage('ballplan_guest_saved_plans', []);
  const [remotePlans, setRemotePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevUserRef = useRef(user);

  const loadRemote = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_plans')
      .select('id, name, item_count, total_price, created_at, items')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (!error) setRemotePlans(data || []);
  };

  useEffect(() => {
    if (user) loadRemote();
    else setRemotePlans([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // On the transition from guest to signed in, push whatever was saved as a
  // guest into the account instead of leaving it stranded locally.
  useEffect(() => {
    const hadNoUser = !prevUserRef.current;
    prevUserRef.current = user;
    if (!hadNoUser || !user || guestPlans.length === 0) return;

    (async () => {
      const rows = guestPlans.map((p) => ({
        user_id: user.id,
        name: p.name,
        items: p.items,
        item_count: p.item_count,
        total_price: p.total_price,
      }));
      const { error } = await supabase.from('saved_plans').insert(rows);
      if (error) return;
      setGuestPlans([]);
      loadRemote();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const savePlan = async ({ items, itemCount, totalPrice }) => {
    const name = planName(items);
    if (!user) {
      setGuestPlans((prev) => [
        {
          id: `guest-${Date.now()}`,
          name,
          items,
          item_count: itemCount,
          total_price: totalPrice,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      return name;
    }

    const { error } = await supabase
      .from('saved_plans')
      .insert({ user_id: user.id, name, items, item_count: itemCount, total_price: totalPrice });
    if (error) throw error;
    await loadRemote();
    return name;
  };

  const deletePlan = async (plan) => {
    if (!user) {
      setGuestPlans((prev) => prev.filter((p) => p.id !== plan.id));
      return;
    }
    const { error } = await supabase.from('saved_plans').delete().eq('id', plan.id);
    if (!error) setRemotePlans((prev) => prev.filter((p) => p.id !== plan.id));
  };

  const plans = user ? remotePlans : guestPlans;

  return (
    <SavedPlansContext.Provider value={{ plans, loading, savePlan, deletePlan }}>
      {children}
    </SavedPlansContext.Provider>
  );
}

export function useSavedPlans() {
  const ctx = useContext(SavedPlansContext);
  if (!ctx) throw new Error('useSavedPlans must be used within SavedPlansProvider');
  return ctx;
}

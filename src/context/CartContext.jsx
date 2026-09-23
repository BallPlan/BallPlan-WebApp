import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from '../utils/useLocalStorage';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'ballplan_cart_guest';

export function CartProvider({ children }) {
  const { user } = useAuth();
  // Keyed per-account so switching users on the same browser doesn't show
  // one person's cart to another — falls back to a shared guest cart when
  // signed out.
  const [items, setItems] = useLocalStorage(`ballplan_cart_${user?.id || 'guest'}`, []);
  const prevUserRef = useRef(user);

  // On the transition from browsing as a guest to being signed in (sign up
  // or sign in), fold whatever was in the guest cart into the account's
  // cart instead of leaving it stranded under the old guest key.
  useEffect(() => {
    const hadNoUser = !prevUserRef.current;
    prevUserRef.current = user;
    if (!hadNoUser || !user) return;

    let guestItems = [];
    try {
      const raw = window.localStorage.getItem(GUEST_CART_KEY);
      guestItems = raw ? JSON.parse(raw) : [];
    } catch {
      guestItems = [];
    }
    if (guestItems.length === 0) return;

    setItems((prev) => {
      const merged = [...prev];
      guestItems.forEach((guestItem) => {
        const idx = merged.findIndex((i) => i.key === guestItem.key);
        if (idx >= 0) merged[idx] = { ...merged[idx], qty: merged[idx].qty + guestItem.qty };
        else merged.push(guestItem);
      });
      return merged;
    });
    try {
      window.localStorage.removeItem(GUEST_CART_KEY);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addItem = (venue, item, kind = 'menu') => {
    const key = `${venue.id}:${item.id}`;
    // Fire-and-forget: powers the "added to cart" count shown on the admin/
    // agent menu views. Not awaited — shouldn't block or fail the add.
    supabase.rpc('increment_cart_add_count', { p_venue_id: venue.id, p_item_id: item.id }).then();
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          venueId: venue.id,
          venueName: venue.name,
          category: venue.tab,
          location: venue.location,
          address: venue.address,
          phone: venue.phone,
          itemId: item.id,
          name: item.name,
          image: item.image,
          unitPrice: item.price,
          qty: 1,
          kind,
        },
      ];
    });
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQty = (key, qty) => {
    if (qty <= 0) {
      removeItem(key);
      return;
    }
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)));
  };

  const clearCart = () => setItems([]);

  // Replaces the cart wholesale with a previously saved snapshot.
  const loadItems = (savedItems) => setItems(savedItems);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0), [items]);

  const isInCart = (venueId, itemId) => items.some((i) => i.venueId === venueId && i.itemId === itemId);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, loadItems, totalItems, totalPrice, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

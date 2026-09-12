import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../utils/useLocalStorage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('ballplan_cart', []);

  const addItem = (venue, item, kind = 'menu') => {
    const key = `${venue.id}:${item.id}`;
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

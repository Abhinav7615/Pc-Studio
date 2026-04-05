'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage only on the client, after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        const parsed: CartItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clear = () => setItems([]);

  return <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
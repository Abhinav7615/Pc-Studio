import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import fetchWithRetry from '@/lib/fetchWithRetry';

interface WishlistContextType {
  wishlist: string[];
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry('/api/wishlist');
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      const data = await res.json();
      setWishlist((data.wishlist?.products || []).map((p: any) => {
        const id = typeof p === 'string' ? p : (p._id || p).toString();
        return id;
      }));
    } catch {
      setWishlist([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) fetchWishlist();
    else setWishlist([]);
  }, [session?.user]);


  const addToWishlist = async (productId: string) => {
    if (session?.user) {
      await fetchWithRetry('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      await fetchWishlist();
    } else {
      // Guest: use localStorage
      const local = JSON.parse(localStorage.getItem('wishlist') || '[]').map((id: any) => id.toString());
      if (!local.includes(productId.toString())) {
        const updated = [...local, productId.toString()];
        localStorage.setItem('wishlist', JSON.stringify(updated));
        setWishlist(updated);
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (session?.user) {
      await fetchWithRetry(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
      await fetchWishlist();
    } else {
      // Guest: use localStorage
      const local = JSON.parse(localStorage.getItem('wishlist') || '[]').map((id: any) => id.toString());
      const updated = local.filter((id: string) => id !== productId.toString());
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setWishlist(updated);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId?.toString());

  // On mount, load guest wishlist from localStorage
  useEffect(() => {
    if (!session?.user) {
      const local = JSON.parse(localStorage.getItem('wishlist') || '[]').map((id: any) => id.toString());
      setWishlist(local);
    }
  }, [session?.user]);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, isInWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

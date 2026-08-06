'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
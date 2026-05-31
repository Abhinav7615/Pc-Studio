'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { ConsumerChatProvider } from './ConsumerChatContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConsumerChatProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </ConsumerChatProvider>
    </SessionProvider>
  );
}
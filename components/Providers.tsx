'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { CartProvider } from './CartContext';
import { ConsumerChatProvider } from './ConsumerChatContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConsumerChatProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ConsumerChatProvider>
    </SessionProvider>
  );
}
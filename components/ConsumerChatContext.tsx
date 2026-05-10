'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ConsumerChatContextType {
  consumerChatEnabled: boolean;
  setConsumerChatEnabled: (enabled: boolean) => void;
  loading: boolean;
}

const ConsumerChatContext = createContext<ConsumerChatContextType | undefined>(undefined);

export function ConsumerChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [consumerChatEnabled, setConsumerChatEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    const fetchChatStatus = async () => {
      try {
        if (!session) {
          setConsumerChatEnabled(false);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setConsumerChatEnabled(data.consumerChatEnabled ?? false);
        }
      } catch (err) {
        console.error('Error fetching chat status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatStatus();
  }, [session, status]);

  return (
    <ConsumerChatContext.Provider value={{ consumerChatEnabled, setConsumerChatEnabled, loading }}>
      {children}
    </ConsumerChatContext.Provider>
  );
}

export function useConsumerChat() {
  const context = useContext(ConsumerChatContext);
  if (context === undefined) {
    throw new Error('useConsumerChat must be used within ConsumerChatProvider');
  }
  return context;
}

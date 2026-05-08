'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export default function OnlinePresenceHeartbeat() {
  const { status } = useSession();

  const updatePresence = useCallback(async () => {
    try {
      await fetch('/api/user/online-status', { method: 'POST' });
    } catch (err) {
      console.error('Online heartbeat failed:', err);
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;

    updatePresence();
    const interval = setInterval(updatePresence, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    const handleFocus = () => {
      updatePresence();
    };

    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/user/online-status');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, updatePresence]);

  return null;
}

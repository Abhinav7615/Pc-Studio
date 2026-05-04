'use client';

import React, { useEffect, useRef } from 'react';
import { useServiceWorker } from '@/hooks/usePWA';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const { swReady } = useServiceWorker();
  const notificationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Log PWA initialization
    console.log('[PWA] PWA Provider initialized');
    console.log('[PWA] Current protocol:', window.location.protocol);
    console.log('[PWA] Current hostname:', window.location.hostname);

    // Check if running on HTTPS or localhost (required for SW)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    console.log('[PWA] Secure context available:', isSecure);

    if (isSecure && swReady) {
      console.log('[PWA] Service Worker is ready and secure context available');
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[PWA] App backgrounded');
      } else {
        console.log('[PWA] App foregrounded');
        // Sync when app comes to foreground
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
              registration.update();
            });
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detect if app is being used in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('[PWA] Running in standalone mode:', isStandalone);

    // Log network connectivity
    const handleOnline = () => console.log('[PWA] Online');
    const handleOffline = () => console.log('[PWA] Offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial connectivity status
    console.log('[PWA] Initial connectivity:', navigator.onLine ? 'Online' : 'Offline');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (notificationRef.current) {
        clearTimeout(notificationRef.current);
      }
    };
  }, [swReady]);

  return <>{children}</>;
}

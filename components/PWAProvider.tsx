'use client';

import React, { useEffect, useState } from 'react';
import { useServiceWorker } from '@/hooks/usePWA';
import PushRegistrar from './PushRegistrar';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const { swReady, updateAvailable, reloadApp } = useServiceWorker();
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

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

    console.log('[PWA] Initial connectivity:', navigator.onLine ? 'Online' : 'Offline');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swReady]);

  useEffect(() => {
    setShowUpdateBanner(updateAvailable);
  }, [updateAvailable]);

  return (
    <>
      <PushRegistrar />
      {children}
      {showUpdateBanner && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Update available</p>
              <p className="mt-1 text-xs text-slate-500">A new version has been published. Refresh the app to load the latest content.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reloadApp}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowUpdateBanner(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

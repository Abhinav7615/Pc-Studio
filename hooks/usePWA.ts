'use client';

import { useEffect, useLayoutEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is installed (standalone mode)');
      setIsInstalled(true);
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('[PWA] iOS detected:', isIOSDevice);
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Check display mode changes
    const handleDisplayModeChange = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App is now in standalone mode');
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window
      .matchMedia('(display-mode: standalone)')
      .addEventListener('change', handleDisplayModeChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window
        .matchMedia('(display-mode: standalone)')
        .removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      console.log('[PWA] Triggering install prompt...');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      } else {
        console.log('[PWA] User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error triggering install prompt:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    installApp,
    isIOS,
    isInstalled,
    deferredPrompt,
  };
}

export function useServiceWorker() {
  const [swActive, setSwActive] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [registrationForUpdate, setRegistrationForUpdate] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Do not register service worker in development to avoid stale cached bundles.
    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(async (registrations) => {
            await Promise.all(registrations.map((registration) => registration.unregister()));
            if ('caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
            }
          })
          .catch((error) => {
            console.error('[PWA] Error cleaning service workers and cache in development:', error);
          });
      }
      return;
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('[PWA] Service worker controller changed, reloading page');
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      const registerSW = async () => {
        try {
          console.log('[PWA] Registering service worker...');
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('[PWA] Service worker registered successfully');
          setSwReady(true);

          if (registration.waiting) {
            console.log('[PWA] Existing waiting service worker found');
            setUpdateAvailable(true);
            setWaitingWorker(registration.waiting);
            setRegistrationForUpdate(registration);
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker version available');
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
                setRegistrationForUpdate(registration);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('sw-update-available', {
                      detail: { registration },
                    })
                  );
                }
              }
            });
          });

          if (registration.active) {
            console.log('[PWA] Service worker is already active');
            setSwActive(true);
          }
        } catch (error) {
          console.error('[PWA] Service worker registration failed:', error);
        }
      };

      const timeout = setTimeout(registerSW, 1000);
      return () => {
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.update());
      });
    }
  }, []);

  const reloadApp = useCallback(() => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data?.success) {
        window.location.reload();
      }
    };

    waitingWorker.postMessage({ type: 'SKIP_WAITING' }, [messageChannel.port2]);
  }, [waitingWorker]);

  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data?.success || false);
        };
        navigator.serviceWorker.controller!.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);
      });
    }
    // Fallback: clear caches directly if no service worker
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      return true;
    }
    return false;
  }, []);

  return {
    swActive,
    swReady,
    updateAvailable,
    updateServiceWorker,
    reloadApp,
    clearCache,
  };
}

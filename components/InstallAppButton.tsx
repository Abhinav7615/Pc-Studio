'use client';

import React, { useState, useEffect } from 'react';
import { usePWAInstall, useServiceWorker } from '@/hooks/usePWA';

export default function InstallAppButton() {
  const { canInstall, installApp, isIOS, isInstalled } = usePWAInstall();
  const { swReady } = useServiceWorker();
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);

  const showInstallButton = canInstall;
  const showFallbackButton = !canInstall && swReady;
  const shouldRenderInstall = showInstallButton || showFallbackButton;

  // Listen for SW updates
  useEffect(() => {
    const handleSWUpdate = () => {
      console.log('[PWA] Update available notification');
      setShowUpdateNotice(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  // Auto-hide hint after 5 seconds
  useEffect(() => {
    if (showInstallHint) {
      const timeout = setTimeout(() => {
        setShowInstallHint(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showInstallHint]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallHint(true);
      setTimeout(() => setShowInstallHint(false), 3000);
    }
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      });
    }
  };

  // Don't show install button if already installed or on iOS (iOS has different UX)
  if (isInstalled) {
    return null;
  }

  // For iOS, show manual installation instructions
  if (isIOS) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowInstallHint(!showInstallHint)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          title="Install PC Studio app"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Install App</span>
        </button>

        {showInstallHint && (
          <div className="absolute top-full mt-2 right-0 bg-white text-slate-900 rounded-lg shadow-lg p-4 w-72 z-50 border border-slate-200">
            <p className="font-semibold mb-3 text-sm">Install PC Studio on iOS</p>
            <ol className="text-sm space-y-2 list-decimal list-inside text-slate-700">
              <li>Tap the Share button (up arrow)</li>
              <li>Select "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
            <button
              onClick={() => setShowInstallHint(false)}
              className="mt-3 w-full px-3 py-2 bg-slate-100 text-slate-900 rounded text-sm font-semibold hover:bg-slate-200"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    );
  }

  const showInstallInstructions = !canInstall && swReady;

  if (!shouldRenderInstall) {
    return null;
  }

  // For Android and other platforms, show standard install button or manual install hint
  return (
    <>
      <div className="flex items-center gap-2">
        {showInstallButton ? (
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-lg transform hover:scale-105"
            title="Install PC Studio app on your device"
            aria-label="Install app"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        ) : (
          <button
            onClick={() => setShowInstallHint(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-slate-200 transition-all hover:shadow-sm"
            title="Add PC Studio to your home screen"
            aria-label="Add to home screen"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4"
              />
            </svg>
            <span className="hidden sm:inline">Add to Home Screen</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {showInstallHint && (
          <div className="fixed bottom-4 left-4 right-4 md:right-auto md:bottom-6 md:left-6 bg-white border border-slate-200 text-slate-900 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4"
                />
              </svg>
              <div>
                <p className="font-semibold text-sm mb-2">Install PC Studio</p>
                <p className="text-sm text-slate-700 leading-6">
                  In your browser menu, choose <span className="font-semibold">Add to Home screen</span> or <span className="font-semibold">Install app</span>.
                </p>
                <button
                  onClick={() => setShowInstallHint(false)}
                  className="mt-3 inline-flex items-center px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-slate-200"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpdateNotice && (
        <div className="fixed bottom-4 left-4 right-4 md:right-auto md:bottom-6 md:left-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 text-amber-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-sm font-semibold">
                A new version of PC Studio is available
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </>
  );
}

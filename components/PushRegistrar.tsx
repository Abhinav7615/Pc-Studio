'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushRegistrar() {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Push not supported in this browser');
      return;
    }

    let mounted = true;

    async function register() {
      try {
        setStatus('checking-permission');
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') {
          setStatus('permission-denied');
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        setStatus('getting-vapid');
        const res = await fetch('/api/push/vapid');
        const json = await res.json();
        const publicKey = json?.publicKey;
        if (!publicKey) {
          console.warn('[Push] No VAPID public key available');
          setStatus('no-vapid');
          return;
        }

        setStatus('subscribing');
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        setStatus('sending-subscription');
        await fetch('/api/devices/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub, platform: 'web' }),
        });

        if (mounted) setStatus('subscribed');
        console.log('[Push] Subscription registered successfully');
      } catch (error) {
        console.error('[Push] Registration failed', error);
        if (mounted) setStatus('error');
      }
    }

    register();

    return () => { mounted = false; };
  }, []);

  return null;
}

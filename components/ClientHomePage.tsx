"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Footer from './Footer';
import ProductList from '@/components/ProductList';
import Link from 'next/link';
import type { BusinessSettings } from '../types/business';

export default function ClientHomePage() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/business-settings');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (mounted) setSettings(data || {});
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-theme-background" style={{ color: settings.textColor || 'inherit' }}>
      {/* Simple Hero */}
      {settings.heroEnabled !== false && (
        <section className="py-12 text-center" style={{ backgroundColor: settings.heroBgColor || '#3b82f6', color: settings.heroTextColor || '#fff' }}>
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold">{settings.heroTitle || 'Welcome to Our Store'}</h1>
            <p className="mt-3 max-w-2xl mx-auto">{settings.heroSubtitle || 'Discover amazing products at great prices'}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="#products" className="px-6 py-3 bg-white text-slate-800 rounded-full font-semibold">{settings.heroButtonText || 'Shop Now'}</Link>
              <a href={settings.contactWhatsapp ? `https://wa.me/${settings.contactWhatsapp}` : '#'} target="_blank" rel="noreferrer" className="px-6 py-3 border rounded-full">Contact</a>
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <div id="products" className="flex-grow px-4 py-8">
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductList />
        </Suspense>
      </div>

      {/* Footer */}
      <Footer settings={settings as BusinessSettings} />
    </div>
  );
}

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
      {/* Hero Section */}
      {settings.heroEnabled !== false && (
        <section 
          className="py-12 md:py-16 px-4 text-center"
          style={{
            backgroundColor: settings.heroBgColor || '#3b82f6',
            color: settings.heroTextColor || '#ffffff'
          }}
        >
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight">
              {settings.heroTitle || 'Welcome to Our Store'}
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-3xl mx-auto opacity-95">
              {settings.heroSubtitle || 'Discover amazing products at great prices'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4">
              <a
                href="#products"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full shadow-lg transition-transform hover:scale-105 min-h-[48px]"
                style={{ 
                  backgroundColor: settings.heroButtonBg || '#ffffff',
                  color: settings.heroButtonTextColor || '#3b82f6'
                }}
              >
                {settings.heroButtonText || 'Shop Now'}
              </a>
              <a
                href={settings.contactWhatsapp ? `https://wa.me/${settings.contactWhatsapp}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full border border-white/90 bg-white/10 text-white hover:bg-white hover:text-slate-900 transition min-h-[48px]"
              >
                🗨️ Contact Support
              </a>
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

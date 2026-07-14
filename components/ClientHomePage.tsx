'use client';

import { useEffect, useState } from 'react';
import Footer from './Footer';
import { useSearchParams } from 'next/navigation';
import ProductList from '@/components/ProductList';
import { Suspense } from 'react';
import Link from 'next/link';

function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return false;
}

interface HomepageSection {
  _id: string;
  type: 'banner' | 'feature' | 'custom';
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  order: number;
  isActive: boolean;
  content?: string;
}

import type { BusinessSettings } from '../types/business';

export default function ClientHomePage() {
    // Default container style for layout
    const containerStyle = { maxWidth: '1200px', margin: '0 auto', width: '100%' };
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [cardModuleSettings, setCardModuleSettings] = useState({ shopSectionEnabled: true, adminSectionEnabled: true, title: 'Premium Virtual Cards', description: 'Explore premium virtual cards with secure checkout and admin verification.' });
  const [bannerSettings, setBannerSettings] = useState<any>(null);
  const searchParams = useSearchParams();

  const bannerHeightClass = (() => {
    const heightMap: Record<string, string> = {
      xs: 'py-6 md:py-8',
      sm: 'py-8 md:py-10',
      md: 'py-8 md:py-12',
      lg: 'py-10 md:py-14',
      xl: 'py-14 md:py-20',
    };
    return heightMap[bannerSettings?.bannerHeight] || heightMap.md;
  })();
  const searchQuery = searchParams?.get('search') ?? '';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/business-settings', {
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          const processedData = {
            ...data,
            heroEnabled: data.heroEnabled === undefined ? true : toBool(data.heroEnabled),
            announcementEnabled: data.announcementEnabled === undefined ? false : toBool(data.announcementEnabled),
            welcomeEnabled: data.welcomeEnabled === undefined ? true : toBool(data.welcomeEnabled),
            featuresEnabled: data.featuresEnabled === undefined ? true : toBool(data.featuresEnabled),
          };
          setSettings(processedData);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchSettings();
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/homepage-sections');
        if (res.ok) {
          const data = await res.json();
          setSections(Array.isArray(data.sections) ? data.sections : []);
        }
      } catch (error) {
        console.error('Failed to fetch homepage sections:', error);
      } finally {
        setSectionsLoaded(true);
      }
    };
    fetchSections();
    const fetchCardModuleSettings = async () => {
      try {
        const res = await fetch('/api/premium-cards/module-settings');
        if (res.ok) {
          const data = await res.json();
          setCardModuleSettings({
            shopSectionEnabled: data.shopSectionEnabled ?? true,
            adminSectionEnabled: data.adminSectionEnabled ?? true,
            title: data.title || 'Premium Virtual Cards',
            description: data.description || 'Explore premium virtual cards with secure checkout and admin verification.',
          });
        }
      } catch (_err) {
        // ignore
      }
    };
    const fetchBannerSettings = async () => {
      try {
        const res = await fetch('/api/premium-cards/banner-settings');
        if (res.ok) {
          const data = await res.json();
          setBannerSettings(data);
        }
      } catch (_err) {
        // ignore
      }
    };
    fetchBannerSettings();
  }, []);

  if (!isLoaded || !sectionsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background" style={{ color: settings.textColor || 'var(--text-color)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render homepage sections (banners, features, custom)
  return (
    <div className="min-h-screen flex flex-col bg-theme-background" style={{ color: settings.textColor || 'var(--text-color)' }}>
      {/* Announcement Banner */}
      {/* Homepage Sections (banners/features/custom) */}
      {/* {renderHomepageSections()} */}
      {settings.announcementEnabled && (
        <div 
          className="py-3 text-center font-medium"
          style={{ 
            backgroundColor: settings.announcementBgColor || '#10b981',
            color: settings.announcementTextColor || '#ffffff'
          }}
        >
          {settings.announcementText || 'Announcement'}
        </div>
      )}

      {/* Hero Section */}
      {settings.heroEnabled && (
        <section 
          className="py-12 md:py-16 px-4 text-center"
          style={{ 
            backgroundColor: settings.heroBgColor || '#3b82f6',
            color: settings.heroTextColor || '#ffffff'
          }}
        >
          <div style={containerStyle} className="mx-auto max-w-4xl">
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

      {cardModuleSettings.shopSectionEnabled && (
        <section className={`px-4 ${bannerHeightClass}`}>
          <div style={containerStyle}>
            <div 
              className="rounded-[28px] border p-6 text-white shadow-lg transition-all duration-300"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${bannerSettings?.bannerBgColor1 || '#0f172a'} 0%, ${bannerSettings?.bannerBgColor2 || '#1e3a8a'} 100%)`,
                borderColor: bannerSettings?.borderColor || '#64748b',
                boxShadow: `0 28px 80px -30px ${bannerSettings?.shadowColor || 'rgba(0,0,0,0.35)'}`
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  {bannerSettings?.showLabel !== false && (
                    <p 
                      className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em]" 
                      style={{ color: bannerSettings?.labelColor || '#fcd34d' }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bannerSettings?.bannerAccentColor || '#fbbf24' }} />
                      {bannerSettings?.bannerLabel || 'Premium Cards'}
                    </p>
                  )}
                  <h2 
                    className="mt-2 text-2xl font-semibold"
                    style={{ color: bannerSettings?.textColor || '#ffffff' }}
                  >
                    {bannerSettings?.bannerTitle || cardModuleSettings.title}
                  </h2>
                  {bannerSettings?.showSubtitle !== false && (
                    <p 
                      className="mt-2 max-w-2xl text-sm"
                      style={{ color: bannerSettings?.subtitleColor || '#cbd5e1' }}
                    >
                      {bannerSettings?.bannerSubtitle || cardModuleSettings.description}
                    </p>
                  )}
                </div>
                <Link 
                  href="/premium-cards" 
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: bannerSettings?.buttonBgColor || '#fbbf24',
                    color: bannerSettings?.buttonTextColor || '#1f2937'
                  }}
                  onMouseEnter={(e) => {
                    if (bannerSettings?.buttonHoverBg) {
                      (e.target as HTMLElement).style.backgroundColor = bannerSettings.buttonHoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (bannerSettings?.buttonBgColor) {
                      (e.target as HTMLElement).style.backgroundColor = bannerSettings.buttonBgColor;
                    }
                  }}
                >
                  {bannerSettings?.buttonText || 'Open Cards Section'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-8 px-4">
        <div style={containerStyle}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Fast Shopping</h2>
              <p className="text-slate-600 mb-4">Search, compare and checkout in just a few taps.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <span className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Quick delivery</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Easy returns</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Trusted quality</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Secure pay</span>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 p-6 text-white shadow-lg border border-blue-300">
              <h2 className="text-xl font-semibold mb-3">Smart Product Discovery</h2>
              <p className="mb-4 opacity-90">Browse personalized deals, auctions and bargains from one smart panel.</p>
              <div className="space-y-2 text-sm">
                <p>⏏ Mobile-friendly product cards</p>
                <p>⏏ Live auction countdowns</p>
                <p>⏏ Save products, buy faster</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product List and Filters (restored above footer) */}
      <div style={containerStyle}>
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductList />
        </Suspense>
      </div>

      {/* Footer at the very end */}
      <Footer settings={settings} />
    </div>
  );
}


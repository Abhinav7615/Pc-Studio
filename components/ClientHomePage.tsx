'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductList from '@/components/ProductList';
import { Suspense } from 'react';

function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return false;
}

interface BusinessSettings {
  websiteName?: string;
  websiteNameColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headerBgColor?: string;
  contactWhatsapp?: string;
  contactWhatsappColor?: string;
  contactEmail?: string;
  contactEmailColor?: string;
  offlineShopEnabled?: boolean;
  offlineShopAddress?: string;
  offlineShopCity?: string;
  offlineShopState?: string;
  offlineShopPincode?: string;
  offlineShopGoogleMapsLink?: string;
  heroEnabled?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgColor?: string;
  heroTextColor?: string;
  heroButtonText?: string;
  heroButtonBg?: string;
  heroButtonTextColor?: string;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  welcomeEnabled?: boolean;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeBgColor?: string;
  welcomeTextColor?: string;
  featuresEnabled?: boolean;
  feature1Icon?: string;
  feature1Title?: string;
  feature1Text?: string;
  feature2Icon?: string;
  feature2Title?: string;
  feature2Text?: string;
  feature3Icon?: string;
  feature3Title?: string;
  feature3Text?: string;
  feature4Icon?: string;
  feature4Title?: string;
  feature4Text?: string;
  featureBgColor?: string;
  featureCardBg?: string;
  featureTextColor?: string;
  containerMaxWidth?: string;
}

export default function ClientHomePage() {
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';

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
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: settings.backgroundColor || '#f8fafc' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const containerStyle = {
    maxWidth: settings.containerMaxWidth || '1280px',
    margin: '0 auto',
    padding: '0 1rem',
  };

  const getWhatsappLink = () => {
    if (settings.contactWhatsapp) {
      return `https://wa.me/${settings.contactWhatsapp.replace(/\D/g, '')}`;
    }
    return '#';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor || '#f8fafc' }}>
      {/* Announcement Banner */}
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
          className="py-16 px-4 text-center"
          style={{ 
            backgroundColor: settings.heroBgColor || '#3b82f6',
            color: settings.heroTextColor || '#ffffff'
          }}
        >
          <div style={containerStyle} className="mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {settings.heroTitle || 'Welcome to Our Store'}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-95">
              {settings.heroSubtitle || 'Discover amazing products at great prices'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="#products"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ 
                  backgroundColor: settings.heroButtonBg || '#ffffff',
                  color: settings.heroButtonTextColor || '#3b82f6'
                }}
              >
                {settings.heroButtonText || 'Shop Now'}
              </a>
              <a
                href={getWhatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full border border-white/90 bg-white/10 text-white hover:bg-white hover:text-slate-900 transition"
              >
                💬 Contact Support
              </a>
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
                <p>✅ Mobile-friendly product cards</p>
                <p>✅ Live auction countdowns</p>
                <p>✅ Save products, buy faster</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Support & Offers</h2>
              <p className="text-slate-600 mb-4">Get order updates, coupons and customer support with a single click.</p>
              <div className="space-y-3">
                <p className="text-sm"><span className="font-semibold">WhatsApp:</span> {settings.contactWhatsapp || 'Not set'}</p>
                <p className="text-sm"><span className="font-semibold">Email:</span> {settings.contactEmail || 'support@example.com'}</p>
                <p className="text-sm"><span className="font-semibold">Location:</span> {settings.offlineShopAddress || 'Online store'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {settings.featuresEnabled && (
        <section 
          className="py-12 px-4"
          style={{ backgroundColor: settings.featureBgColor || '#f1f5f9' }}
        >
          <div style={containerStyle}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div 
                className="text-center p-6 rounded-xl shadow-sm"
                style={{ 
                  backgroundColor: settings.featureCardBg || '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div className="text-5xl mb-4">{settings.feature1Icon || '🚚'}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  {settings.feature1Title || 'Free Shipping'}
                </h3>
                <p className="text-sm" style={{ color: settings.featureTextColor || '#475569' }}>
                  {settings.feature1Text || 'On orders over ₹1000'}
                </p>
              </div>

              {/* Feature 2 */}
              <div 
                className="text-center p-6 rounded-xl shadow-sm"
                style={{ 
                  backgroundColor: settings.featureCardBg || '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div className="text-5xl mb-4">{settings.feature2Icon || '🔒'}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  {settings.feature2Title || 'Secure Payment'}
                </h3>
                <p className="text-sm" style={{ color: settings.featureTextColor || '#475569' }}>
                  {settings.feature2Text || '100% secure checkout'}
                </p>
              </div>

              {/* Feature 3 */}
              <div 
                className="text-center p-6 rounded-xl shadow-sm"
                style={{ 
                  backgroundColor: settings.featureCardBg || '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div className="text-5xl mb-4">{settings.feature3Icon || '💯'}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  {settings.feature3Title || 'Quality Assured'}
                </h3>
                <p className="text-sm" style={{ color: settings.featureTextColor || '#475569' }}>
                  {settings.feature3Text || 'All products checked'}
                </p>
              </div>

              {/* Feature 4 */}
              <div 
                className="text-center p-6 rounded-xl shadow-sm"
                style={{ 
                  backgroundColor: settings.featureCardBg || '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div className="text-5xl mb-4">{settings.feature4Icon || '📞'}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>
                  {settings.feature4Title || '24/7 Support'}
                </h3>
                <p className="text-sm" style={{ color: settings.featureTextColor || '#475569' }}>
                  {settings.feature4Text || 'Dedicated support team'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Section */}
      {settings.welcomeEnabled && (
        <section className="py-12 px-4">
          <div style={containerStyle}>
            <div 
              className="text-center p-8 rounded-2xl shadow-lg"
              style={{ 
                backgroundColor: settings.welcomeBgColor || '#ffffff',
                color: settings.welcomeTextColor || '#1e293b'
              }}
            >
              <h2 className="text-3xl font-bold mb-4" style={{ color: settings.websiteNameColor || '#3b82f6' }}>
                {settings.welcomeTitle || 'Welcome to Our Store'}
              </h2>
              <p className="text-lg opacity-80">
                {settings.welcomeSubtitle || 'High-quality products at unbeatable prices'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Offline Shop Info */}
      {settings.offlineShopEnabled && (
        <section className="py-8 px-4">
          <div style={containerStyle}>
            <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-900 mb-3">🏪 Visit Our Offline Store</h3>
              {settings.offlineShopAddress && (
                <p className="text-blue-800 mb-1">
                  <strong>Address:</strong> {settings.offlineShopAddress}
                </p>
              )}
              {(settings.offlineShopCity || settings.offlineShopState || settings.offlineShopPincode) && (
                <p className="text-blue-800 mb-1">
                  <strong>Location:</strong> {[
                    settings.offlineShopCity,
                    settings.offlineShopState,
                    settings.offlineShopPincode
                  ].filter(Boolean).join(', ')}
                </p>
              )}
              {settings.offlineShopGoogleMapsLink && (
                <a 
                  href={settings.offlineShopGoogleMapsLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-700 font-semibold hover:underline"
                >
                  📍 Open in Google Maps
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Info */}
      {(settings.contactWhatsapp || settings.contactEmail) && (
        <section className="py-8 px-4">
          <div style={containerStyle}>
            <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-900 mb-3">📞 Contact Details</h3>
              {settings.contactWhatsapp && (
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: settings.contactWhatsappColor || '#22c55e' }}>WhatsApp:</span>
                  <a 
                    href={getWhatsappLink()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-semibold hover:underline"
                    style={{ color: settings.contactWhatsappColor || '#22c55e' }}
                  >
                    {settings.contactWhatsapp}
                  </a>
                </div>
              )}
              {settings.contactEmail && (
                <div className="flex items-center gap-2">
                  <span style={{ color: settings.contactEmailColor || '#3b82f6' }}>Email:</span>
                  <a 
                    href={`mailto:${settings.contactEmail}`}
                    className="font-semibold hover:underline"
                    style={{ color: settings.contactEmailColor || '#3b82f6' }}
                  >
                    {settings.contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section id="products" className="py-12 px-4">
        <div style={containerStyle}>
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#0f172a' }}>
            Featured Products
          </h2>
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          }>
            <ProductList initialSearchQuery={searchQuery} />
          </Suspense>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 px-4 text-white"
        style={{ backgroundColor: '#1e293b' }}
      >
        <div style={containerStyle}>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2" style={{ color: settings.websiteNameColor || '#3b82f6' }}>
              {settings.websiteName || 'Refurbished PC Studio'}
            </h3>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

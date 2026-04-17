'use client';

import { useCallback, useEffect, useState } from 'react';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  websiteNameColor: string;
  headerBgColor: string;
  footerBgColor: string;
  cardColor: string;
  cardBorderColor: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  productCardBg: string;
  productCardBorder: string;
  productPriceColor: string;
  productTitleColor: string;
  featureBgColor: string;
  featureCardBg: string;
  featureTextColor: string;
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroBgColor: string;
  heroTextColor: string;
  heroButtonText: string;
  heroButtonBg: string;
  heroButtonTextColor: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementBgColor: string;
  announcementTextColor: string;
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeBgColor: string;
  welcomeTextColor: string;
  featuresEnabled: boolean;
  feature1Icon: string;
  feature1Title: string;
  feature1Text: string;
  feature2Icon: string;
  feature2Title: string;
  feature2Text: string;
  feature3Icon: string;
  feature3Title: string;
  feature3Text: string;
  feature4Icon: string;
  feature4Title: string;
  feature4Text: string;
  fontFamily: string;
  headingFontFamily: string;
  buttonRadius: string;
  cardRadius: string;
  containerMaxWidth: string;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
  backgroundColor: '#f8fafc',
  textColor: '#1e293b',
  headingColor: '#0f172a',
  websiteNameColor: '#3b82f6',
  headerBgColor: '#ffffff',
  footerBgColor: '#1e293b',
  cardColor: '#ffffff',
  cardBorderColor: '#e2e8f0',
  buttonPrimaryBg: '#3b82f6',
  buttonPrimaryText: '#ffffff',
  buttonSecondaryBg: '#8b5cf6',
  buttonSecondaryText: '#ffffff',
  productCardBg: '#ffffff',
  productCardBorder: '#e2e8f0',
  productPriceColor: '#3b82f6',
  productTitleColor: '#1e293b',
  featureBgColor: '#f1f5f9',
  featureCardBg: '#ffffff',
  featureTextColor: '#475569',
  heroEnabled: true,
  heroTitle: 'Welcome to Our Store',
  heroSubtitle: 'Discover amazing products at great prices',
  heroBgColor: '#3b82f6',
  heroTextColor: '#ffffff',
  heroButtonText: 'Shop Now',
  heroButtonBg: '#ffffff',
  heroButtonTextColor: '#3b82f6',
  announcementEnabled: false,
  announcementText: 'Free shipping on orders over ₹1000!',
  announcementBgColor: '#10b981',
  announcementTextColor: '#ffffff',
  welcomeEnabled: true,
  welcomeTitle: 'Welcome to Our Store',
  welcomeSubtitle: 'High-quality products at unbeatable prices',
  welcomeBgColor: '#ffffff',
  welcomeTextColor: '#1e293b',
  featuresEnabled: true,
  feature1Icon: '🚚',
  feature1Title: 'Free Shipping',
  feature1Text: 'On orders over ₹1000',
  feature2Icon: '🔒',
  feature2Title: 'Secure Payment',
  feature2Text: '100% secure checkout',
  feature3Icon: '💯',
  feature3Title: 'Quality Assured',
  feature3Text: 'All products checked',
  feature4Icon: '📞',
  feature4Title: '24/7 Support',
  feature4Text: 'Dedicated support team',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  headingFontFamily: 'system-ui, -apple-system, sans-serif',
  buttonRadius: '0.75rem',
  cardRadius: '1rem',
  containerMaxWidth: '1280px',
};

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 min-w-[120px]">{label}:</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
        placeholder="#000000"
      />
    </div>
  );
}

export default function ThemeCustomizationPage() {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('colors');
  const [history, setHistory] = useState<{ timestamp: Date; settings: ThemeSettings }[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      // Add timestamp to prevent caching and ensure fresh data
      const res = await fetch(`/api/business-settings?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const loadedTheme: ThemeSettings = {
          primaryColor: data.primaryColor || defaultTheme.primaryColor,
          secondaryColor: data.secondaryColor || defaultTheme.secondaryColor,
          accentColor: data.accentColor || defaultTheme.accentColor,
          backgroundColor: data.backgroundColor || defaultTheme.backgroundColor,
          textColor: data.textColor || defaultTheme.textColor,
          headingColor: data.headingColor || defaultTheme.headingColor,
          websiteNameColor: data.websiteNameColor || defaultTheme.websiteNameColor,
          headerBgColor: data.headerBgColor || data.headerColor || defaultTheme.headerBgColor,
          footerBgColor: data.footerBgColor || defaultTheme.footerBgColor,
          cardColor: data.cardColor || defaultTheme.cardColor,
          cardBorderColor: data.cardBorderColor || defaultTheme.cardBorderColor,
          buttonPrimaryBg: data.buttonPrimaryBg || data.buttonPrimaryColor || defaultTheme.buttonPrimaryBg,
          buttonPrimaryText: data.buttonPrimaryText || defaultTheme.buttonPrimaryText,
          buttonSecondaryBg: data.buttonSecondaryBg || data.buttonSecondaryColor || defaultTheme.buttonSecondaryBg,
          buttonSecondaryText: data.buttonSecondaryText || defaultTheme.buttonSecondaryText,
          productCardBg: data.productCardBg || defaultTheme.productCardBg,
          productCardBorder: data.productCardBorder || defaultTheme.productCardBorder,
          productPriceColor: data.productPriceColor || defaultTheme.productPriceColor,
          productTitleColor: data.productTitleColor || defaultTheme.productTitleColor,
          featureBgColor: data.featureBgColor || defaultTheme.featureBgColor,
          featureCardBg: data.featureCardBg || defaultTheme.featureCardBg,
          featureTextColor: data.featureTextColor || defaultTheme.featureTextColor,
          heroEnabled: data.heroEnabled ?? true,
          heroTitle: data.heroTitle || defaultTheme.heroTitle,
          heroSubtitle: data.heroSubtitle || defaultTheme.heroSubtitle,
          heroBgColor: data.heroBgColor || defaultTheme.heroBgColor,
          heroTextColor: data.heroTextColor || defaultTheme.heroTextColor,
          heroButtonText: data.heroButtonText || defaultTheme.heroButtonText,
          heroButtonBg: data.heroButtonBg || defaultTheme.heroButtonBg,
          heroButtonTextColor: data.heroButtonTextColor || defaultTheme.heroButtonTextColor,
          announcementEnabled: data.announcementEnabled ?? false,
          announcementText: data.announcementText || defaultTheme.announcementText,
          announcementBgColor: data.announcementBgColor || defaultTheme.announcementBgColor,
          announcementTextColor: data.announcementTextColor || defaultTheme.announcementTextColor,
          welcomeEnabled: data.welcomeEnabled ?? true,
          welcomeTitle: data.welcomeTitle || defaultTheme.welcomeTitle,
          welcomeSubtitle: data.welcomeSubtitle || defaultTheme.welcomeSubtitle,
          welcomeBgColor: data.welcomeBgColor || defaultTheme.welcomeBgColor,
          welcomeTextColor: data.welcomeTextColor || defaultTheme.welcomeTextColor,
          featuresEnabled: data.featuresEnabled ?? true,
          feature1Icon: data.feature1Icon || defaultTheme.feature1Icon,
          feature1Title: data.feature1Title || defaultTheme.feature1Title,
          feature1Text: data.feature1Text || defaultTheme.feature1Text,
          feature2Icon: data.feature2Icon || defaultTheme.feature2Icon,
          feature2Title: data.feature2Title || defaultTheme.feature2Title,
          feature2Text: data.feature2Text || defaultTheme.feature2Text,
          feature3Icon: data.feature3Icon || defaultTheme.feature3Icon,
          feature3Title: data.feature3Title || defaultTheme.feature3Title,
          feature3Text: data.feature3Text || defaultTheme.feature3Text,
          feature4Icon: data.feature4Icon || defaultTheme.feature4Icon,
          feature4Title: data.feature4Title || defaultTheme.feature4Title,
          feature4Text: data.feature4Text || defaultTheme.feature4Text,
          fontFamily: data.fontFamily || defaultTheme.fontFamily,
          headingFontFamily: data.headingFontFamily || defaultTheme.headingFontFamily,
          buttonRadius: data.buttonRadius || defaultTheme.buttonRadius,
          cardRadius: data.cardRadius || defaultTheme.cardRadius,
          containerMaxWidth: data.containerMaxWidth || defaultTheme.containerMaxWidth,
        };
        setTheme(loadedTheme);
        
        if (data.customizationHistory && Array.isArray(data.customizationHistory)) {
          setHistory(data.customizationHistory.slice(-3).reverse());
        }
      }
    } catch (_err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const saveTheme = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const themeData = {
        ...theme,
        announcementEnabled: !!theme.announcementEnabled,
        heroEnabled: !!theme.heroEnabled,
        welcomeEnabled: !!theme.welcomeEnabled,
        featuresEnabled: !!theme.featuresEnabled,
      };

      const res = await fetch('/api/business-settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData),
      });

      if (res.ok) {
        setSuccess('Theme saved successfully!');
        await fetchSettings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (_err) {
      setError('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Reset all theme settings to default?')) {
      setTheme(defaultTheme);
    }
  };

  const restoreFromHistory = (historyItem: { timestamp: Date; settings: ThemeSettings }) => {
    if (confirm('Restore this customization?')) {
      setTheme(historyItem.settings);
    }
  };

  const tabs = [
    { id: 'colors', label: '🎨 Colors' },
    { id: 'layout', label: '📐 Layout' },
    { id: 'hero', label: '🖼️ Hero' },
    { id: 'banner', label: '📢 Banner' },
    { id: 'welcome', label: '👋 Welcome' },
    { id: 'features', label: '⭐ Features' },
    { id: 'preview', label: '👁️ Preview' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold">🎨 Customer Interface Customization</h1>
          <p className="text-indigo-100 mt-2">Customize colors, text, and sections for your customers</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2 mb-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={saveTheme}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : '💾 Save Theme'}
                </button>
                <button
                  onClick={resetToDefault}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                >
                  🔄 Reset to Default
                </button>
              </div>

              {history.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Recent Customizations</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => restoreFromHistory(item)}
                        className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                      >
                        <div className="font-medium">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">🎨 Theme Colors</h2>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Primary Colors</h3>
                    <div className="space-y-3">
                      <ColorInput label="Primary" value={theme.primaryColor} onChange={(v) => updateTheme({ primaryColor: v })} />
                      <ColorInput label="Secondary" value={theme.secondaryColor} onChange={(v) => updateTheme({ secondaryColor: v })} />
                      <ColorInput label="Accent" value={theme.accentColor} onChange={(v) => updateTheme({ accentColor: v })} />
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3">Background & Layout</h3>
                    <div className="space-y-3">
                      <ColorInput label="Background" value={theme.backgroundColor} onChange={(v) => updateTheme({ backgroundColor: v })} />
                      <ColorInput label="Header BG" value={theme.headerBgColor} onChange={(v) => updateTheme({ headerBgColor: v })} />
                      <ColorInput label="Footer BG" value={theme.footerBgColor} onChange={(v) => updateTheme({ footerBgColor: v })} />
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3">Text Colors</h3>
                    <div className="space-y-3">
                      <ColorInput label="Body Text" value={theme.textColor} onChange={(v) => updateTheme({ textColor: v })} />
                      <ColorInput label="Headings" value={theme.headingColor} onChange={(v) => updateTheme({ headingColor: v })} />
                      <ColorInput label="Website Name" value={theme.websiteNameColor} onChange={(v) => updateTheme({ websiteNameColor: v })} />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3">Button Colors</h3>
                    <div className="space-y-3">
                      <ColorInput label="Primary Btn BG" value={theme.buttonPrimaryBg} onChange={(v) => updateTheme({ buttonPrimaryBg: v })} />
                      <ColorInput label="Primary Btn Text" value={theme.buttonPrimaryText} onChange={(v) => updateTheme({ buttonPrimaryText: v })} />
                      <ColorInput label="Secondary Btn BG" value={theme.buttonSecondaryBg} onChange={(v) => updateTheme({ buttonSecondaryBg: v })} />
                      <ColorInput label="Secondary Btn Text" value={theme.buttonSecondaryText} onChange={(v) => updateTheme({ buttonSecondaryText: v })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">📐 Layout & Typography</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                      <select
                        value={theme.fontFamily}
                        onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="system-ui, -apple-system, sans-serif">System UI</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="'Poppins', sans-serif">Poppins</option>
                        <option value="'Nunito', sans-serif">Nunito</option>
                        <option value="'Inter', sans-serif">Inter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Radius</label>
                      <input
                        type="text"
                        value={theme.buttonRadius}
                        onChange={(e) => updateTheme({ buttonRadius: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="0.75rem"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Radius</label>
                      <input
                        type="text"
                        value={theme.cardRadius}
                        onChange={(e) => updateTheme({ cardRadius: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="1rem"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Container Width</label>
                      <select
                        value={theme.containerMaxWidth}
                        onChange={(e) => updateTheme({ containerMaxWidth: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="768px">Small (768px)</option>
                        <option value="1024px">Medium (1024px)</option>
                        <option value="1280px">Large (1280px)</option>
                        <option value="1536px">XL (1536px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Tab */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">🖼️ Hero Section</h2>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="heroEnabled"
                      checked={theme.heroEnabled}
                      onChange={(e) => updateTheme({ heroEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="heroEnabled" className="font-medium">Enable Hero Section</label>
                  </div>

                  {theme.heroEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                        <input
                          type="text"
                          value={theme.heroTitle}
                          onChange={(e) => updateTheme({ heroTitle: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                        <input
                          type="text"
                          value={theme.heroSubtitle}
                          onChange={(e) => updateTheme({ heroSubtitle: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={theme.heroButtonText}
                          onChange={(e) => updateTheme({ heroButtonText: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <ColorInput label="Background" value={theme.heroBgColor} onChange={(v) => updateTheme({ heroBgColor: v })} />
                        <ColorInput label="Text Color" value={theme.heroTextColor} onChange={(v) => updateTheme({ heroTextColor: v })} />
                        <ColorInput label="Button BG" value={theme.heroButtonBg} onChange={(v) => updateTheme({ heroButtonBg: v })} />
                        <ColorInput label="Button Text" value={theme.heroButtonTextColor} onChange={(v) => updateTheme({ heroButtonTextColor: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Banner Tab */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">📢 Announcement Banner</h2>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="announcementEnabled"
                      checked={!!theme.announcementEnabled}
                      onChange={(e) => {
                        updateTheme({ announcementEnabled: e.target.checked });
                      }}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <label htmlFor="announcementEnabled" className="font-medium cursor-pointer">Enable Announcement</label>
                  </div>

                  {theme.announcementEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text</label>
                        <input
                          type="text"
                          value={theme.announcementText || ''}
                          onChange={(e) => updateTheme({ announcementText: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Background" value={theme.announcementBgColor || '#10b981'} onChange={(v) => updateTheme({ announcementBgColor: v })} />
                        <ColorInput label="Text Color" value={theme.announcementTextColor || '#ffffff'} onChange={(v) => updateTheme({ announcementTextColor: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Welcome Tab */}
              {activeTab === 'welcome' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">👋 Welcome Section</h2>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="welcomeEnabled"
                      checked={theme.welcomeEnabled}
                      onChange={(e) => updateTheme({ welcomeEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="welcomeEnabled" className="font-medium">Enable Welcome Section</label>
                  </div>

                  {theme.welcomeEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Title</label>
                        <input
                          type="text"
                          value={theme.welcomeTitle}
                          onChange={(e) => updateTheme({ welcomeTitle: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Subtitle</label>
                        <input
                          type="text"
                          value={theme.welcomeSubtitle}
                          onChange={(e) => updateTheme({ welcomeSubtitle: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Background" value={theme.welcomeBgColor} onChange={(v) => updateTheme({ welcomeBgColor: v })} />
                        <ColorInput label="Text Color" value={theme.welcomeTextColor} onChange={(v) => updateTheme({ welcomeTextColor: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">⭐ Features Section</h2>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="featuresEnabled"
                      checked={theme.featuresEnabled}
                      onChange={(e) => updateTheme({ featuresEnabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="featuresEnabled" className="font-medium">Enable Features</label>
                  </div>

                  {theme.featuresEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                          <input type="text" value={theme.feature1Icon} onChange={(e) => updateTheme({ feature1Icon: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-2xl" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input type="text" value={theme.feature1Title} onChange={(e) => updateTheme({ feature1Title: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input type="text" value={theme.feature1Text} onChange={(e) => updateTheme({ feature1Text: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                          <input type="text" value={theme.feature2Icon} onChange={(e) => updateTheme({ feature2Icon: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-2xl" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input type="text" value={theme.feature2Title} onChange={(e) => updateTheme({ feature2Title: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input type="text" value={theme.feature2Text} onChange={(e) => updateTheme({ feature2Text: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                          <input type="text" value={theme.feature3Icon} onChange={(e) => updateTheme({ feature3Icon: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-2xl" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input type="text" value={theme.feature3Title} onChange={(e) => updateTheme({ feature3Title: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input type="text" value={theme.feature3Text} onChange={(e) => updateTheme({ feature3Text: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                          <input type="text" value={theme.feature4Icon} onChange={(e) => updateTheme({ feature4Icon: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1 text-center text-2xl" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input type="text" value={theme.feature4Title} onChange={(e) => updateTheme({ feature4Title: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input type="text" value={theme.feature4Text} onChange={(e) => updateTheme({ feature4Text: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <ColorInput label="Section BG" value={theme.featureBgColor} onChange={(v) => updateTheme({ featureBgColor: v })} />
                        <ColorInput label="Text Color" value={theme.featureTextColor} onChange={(v) => updateTheme({ featureTextColor: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">👁️ Live Preview</h2>
                  
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden" style={{ backgroundColor: theme.backgroundColor }}>
                    {/* Announcement */}
                    {theme.announcementEnabled && (
                      <div className="py-3 text-center font-medium" style={{ backgroundColor: theme.announcementBgColor, color: theme.announcementTextColor }}>
                        {theme.announcementText}
                      </div>
                    )}

                    {/* Hero */}
                    {theme.heroEnabled && (
                      <section className="py-12 text-center" style={{ backgroundColor: theme.heroBgColor, color: theme.heroTextColor }}>
                        <h1 className="text-3xl font-bold mb-2">{theme.heroTitle}</h1>
                        <p className="opacity-90 mb-4">{theme.heroSubtitle}</p>
                        <button style={{ backgroundColor: theme.heroButtonBg, color: theme.heroButtonTextColor }} className="px-6 py-2 rounded-lg font-medium">
                          {theme.heroButtonText}
                        </button>
                      </section>
                    )}

                    {/* Features */}
                    {theme.featuresEnabled && (
                      <section className="py-8 px-4" style={{ backgroundColor: theme.featureBgColor }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { icon: theme.feature1Icon, title: theme.feature1Title, text: theme.feature1Text },
                            { icon: theme.feature2Icon, title: theme.feature2Title, text: theme.feature2Text },
                            { icon: theme.feature3Icon, title: theme.feature3Title, text: theme.feature3Text },
                            { icon: theme.feature4Icon, title: theme.feature4Title, text: theme.feature4Text },
                          ].map((f, i) => (
                            <div key={i} className="text-center p-4 rounded-lg" style={{ backgroundColor: theme.featureCardBg }}>
                              <div className="text-3xl mb-2">{f.icon}</div>
                              <div className="font-bold" style={{ color: theme.headingColor }}>{f.title}</div>
                              <div className="text-sm" style={{ color: theme.featureTextColor }}>{f.text}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Welcome */}
                    {theme.welcomeEnabled && (
                      <section className="py-8 px-4" style={{ backgroundColor: theme.welcomeBgColor, color: theme.welcomeTextColor }}>
                        <div className="text-center">
                          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.websiteNameColor }}>{theme.welcomeTitle}</h2>
                          <p>{theme.welcomeSubtitle}</p>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

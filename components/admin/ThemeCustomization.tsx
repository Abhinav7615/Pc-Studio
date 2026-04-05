'use client';

import { useState, useEffect } from 'react';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headerBgColor: string;
  footerBgColor: string;
  textColor: string;
  headingColor: string;
  websiteNameColor: string;
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
  fontFamily: string;
  headingFontFamily: string;
  buttonRadius: string;
  cardRadius: string;
  containerMaxWidth: string;
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
  featureBgColor: string;
  featureCardBg: string;
  featureTextColor: string;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#10b981',
  backgroundColor: '#f8fafc',
  headerBgColor: '#ffffff',
  footerBgColor: '#1e293b',
  textColor: '#1e293b',
  headingColor: '#0f172a',
  websiteNameColor: '#3b82f6',
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
  fontFamily: 'system-ui, -apple-system, sans-serif',
  headingFontFamily: 'system-ui, -apple-system, sans-serif',
  buttonRadius: '0.75rem',
  cardRadius: '1rem',
  containerMaxWidth: '1280px',
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
  featureBgColor: '#f1f5f9',
  featureCardBg: '#ffffff',
  featureTextColor: '#475569',
};

interface Props {
  settings: ThemeSettings;
  onChange: (theme: Partial<ThemeSettings>) => void;
}

function ColorInput({ label, value, onChange, id }: { label: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 min-w-[120px]">{label}:</label>
      <input
        type="color"
        id={id}
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

export default function ThemeCustomization({ settings, onChange }: Props) {
  const [activeTab, setActiveTab] = useState('colors');
  const [previewMode, setPreviewMode] = useState(false);

  const tabs = [
    { id: 'colors', label: '🎨 Colors' },
    { id: 'layout', label: '📐 Layout' },
    { id: 'hero', label: '🖼️ Hero Section' },
    { id: 'banner', label: '📢 Announcement' },
    { id: 'welcome', label: '👋 Welcome' },
    { id: 'features', label: '⭐ Features' },
    { id: 'products', label: '📦 Products' },
    { id: 'preview', label: '👁️ Preview' },
  ];

  const resetToDefault = () => {
    if (confirm('Reset all theme settings to default? This will save and reload.')) {
      onChange(defaultTheme);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <h3 className="text-xl font-bold text-white">🎨 Customer Interface Customization</h3>
        <p className="text-indigo-100 text-sm mt-1">Customize colors, text, and sections for your customers</p>
      </div>

      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-h-[500px] overflow-y-auto">
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Primary Colors</h4>
              <div className="space-y-3">
                <ColorInput label="Primary Color" value={settings.primaryColor} onChange={(v) => onChange({ primaryColor: v })} id="primaryColor" />
                <ColorInput label="Secondary Color" value={settings.secondaryColor} onChange={(v) => onChange({ secondaryColor: v })} id="secondaryColor" />
                <ColorInput label="Accent Color" value={settings.accentColor} onChange={(v) => onChange({ accentColor: v })} id="accentColor" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Background & Header</h4>
              <div className="space-y-3">
                <ColorInput label="Background" value={settings.backgroundColor} onChange={(v) => onChange({ backgroundColor: v })} id="backgroundColor" />
                <ColorInput label="Header BG" value={settings.headerBgColor} onChange={(v) => onChange({ headerBgColor: v })} id="headerBgColor" />
                <ColorInput label="Footer BG" value={settings.footerBgColor} onChange={(v) => onChange({ footerBgColor: v })} id="footerBgColor" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Text Colors</h4>
              <div className="space-y-3">
                <ColorInput label="Body Text" value={settings.textColor} onChange={(v) => onChange({ textColor: v })} id="textColor" />
                <ColorInput label="Headings" value={settings.headingColor} onChange={(v) => onChange({ headingColor: v })} id="headingColor" />
                <ColorInput label="Website Name" value={settings.websiteNameColor} onChange={(v) => onChange({ websiteNameColor: v })} id="websiteNameColor" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">Button Colors</h4>
              <div className="space-y-3">
                <ColorInput label="Primary Btn BG" value={settings.buttonPrimaryBg} onChange={(v) => onChange({ buttonPrimaryBg: v })} id="buttonPrimaryBg" />
                <ColorInput label="Primary Btn Text" value={settings.buttonPrimaryText} onChange={(v) => onChange({ buttonPrimaryText: v })} id="buttonPrimaryText" />
                <ColorInput label="Secondary Btn BG" value={settings.buttonSecondaryBg} onChange={(v) => onChange({ buttonSecondaryBg: v })} id="buttonSecondaryBg" />
                <ColorInput label="Secondary Btn Text" value={settings.buttonSecondaryText} onChange={(v) => onChange({ buttonSecondaryText: v })} id="buttonSecondaryText" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Typography</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="system-ui, -apple-system, sans-serif">System UI</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Nunito', sans-serif">Nunito</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Border Radius</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Radius</label>
                  <input
                    type="text"
                    value={settings.buttonRadius}
                    onChange={(e) => onChange({ buttonRadius: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.75rem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Radius</label>
                  <input
                    type="text"
                    value={settings.cardRadius}
                    onChange={(e) => onChange({ cardRadius: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="1rem"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Container</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Width</label>
                <select
                  value={settings.containerMaxWidth}
                  onChange={(e) => onChange({ containerMaxWidth: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="768px">Small (768px)</option>
                  <option value="1024px">Medium (1024px)</option>
                  <option value="1280px">Large (1280px)</option>
                  <option value="1536px">Extra Large (1536px)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Hero Section</h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.heroEnabled}
                  onChange={(e) => onChange({ heroEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Enable Hero Section</span>
              </label>
            </div>

            {settings.heroEnabled && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) => onChange({ heroTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Welcome to Our Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                  <input
                    type="text"
                    value={settings.heroSubtitle}
                    onChange={(e) => onChange({ heroSubtitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Discover amazing products"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={settings.heroButtonText}
                    onChange={(e) => onChange({ heroButtonText: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Shop Now"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Background" value={settings.heroBgColor} onChange={(v) => onChange({ heroBgColor: v })} id="heroBgColor" />
                  <ColorInput label="Text Color" value={settings.heroTextColor} onChange={(v) => onChange({ heroTextColor: v })} id="heroTextColor" />
                  <ColorInput label="Button BG" value={settings.heroButtonBg} onChange={(v) => onChange({ heroButtonBg: v })} id="heroButtonBg" />
                  <ColorInput label="Button Text" value={settings.heroButtonTextColor} onChange={(v) => onChange({ heroButtonTextColor: v })} id="heroButtonTextColor" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'banner' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Announcement Banner</h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.announcementEnabled}
                  onChange={(e) => onChange({ announcementEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Enable Banner</span>
              </label>
            </div>

            {settings.announcementEnabled && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text</label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => onChange({ announcementText: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Free shipping on orders over ₹1000!"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Background" value={settings.announcementBgColor} onChange={(v) => onChange({ announcementBgColor: v })} id="announcementBgColor" />
                  <ColorInput label="Text Color" value={settings.announcementTextColor} onChange={(v) => onChange({ announcementTextColor: v })} id="announcementTextColor" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'welcome' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Welcome Section</h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.welcomeEnabled}
                  onChange={(e) => onChange({ welcomeEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Enable Welcome</span>
              </label>
            </div>

            {settings.welcomeEnabled && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Title</label>
                  <input
                    type="text"
                    value={settings.welcomeTitle}
                    onChange={(e) => onChange({ welcomeTitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Welcome to Our Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Subtitle</label>
                  <input
                    type="text"
                    value={settings.welcomeSubtitle}
                    onChange={(e) => onChange({ welcomeSubtitle: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="High-quality products"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Background" value={settings.welcomeBgColor} onChange={(v) => onChange({ welcomeBgColor: v })} id="welcomeBgColor" />
                  <ColorInput label="Text Color" value={settings.welcomeTextColor} onChange={(v) => onChange({ welcomeTextColor: v })} id="welcomeTextColor" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Features Section</h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.featuresEnabled}
                  onChange={(e) => onChange({ featuresEnabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Enable Features</span>
              </label>
            </div>

            {settings.featuresEnabled && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-3">Feature 1</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={settings.feature1Icon} onChange={(e) => onChange({ feature1Icon: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-center text-2xl" placeholder="🚚" />
                    <input type="text" value={settings.feature1Title} onChange={(e) => onChange({ feature1Title: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Title" />
                    <input type="text" value={settings.feature1Text} onChange={(e) => onChange({ feature1Text: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Description" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-900 mb-3">Feature 2</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={settings.feature2Icon} onChange={(e) => onChange({ feature2Icon: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-center text-2xl" placeholder="🔒" />
                    <input type="text" value={settings.feature2Title} onChange={(e) => onChange({ feature2Title: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Title" />
                    <input type="text" value={settings.feature2Text} onChange={(e) => onChange({ feature2Text: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Description" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-900 mb-3">Feature 3</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={settings.feature3Icon} onChange={(e) => onChange({ feature3Icon: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-center text-2xl" placeholder="💯" />
                    <input type="text" value={settings.feature3Title} onChange={(e) => onChange({ feature3Title: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Title" />
                    <input type="text" value={settings.feature3Text} onChange={(e) => onChange({ feature3Text: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Description" />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h5 className="font-medium text-orange-900 mb-3">Feature 4</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={settings.feature4Icon} onChange={(e) => onChange({ feature4Icon: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-center text-2xl" placeholder="📞" />
                    <input type="text" value={settings.feature4Title} onChange={(e) => onChange({ feature4Title: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Title" />
                    <input type="text" value={settings.feature4Text} onChange={(e) => onChange({ feature4Text: e.target.value })} className="border border-gray-300 rounded px-2 py-1" placeholder="Description" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Section BG" value={settings.featureBgColor} onChange={(v) => onChange({ featureBgColor: v })} id="featureBgColor" />
                  <ColorInput label="Text Color" value={settings.featureTextColor} onChange={(v) => onChange({ featureTextColor: v })} id="featureTextColor" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-900">Product Card Colors</h4>
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Card Background" value={settings.productCardBg} onChange={(v) => onChange({ productCardBg: v })} id="productCardBg" />
              <ColorInput label="Card Border" value={settings.productCardBorder} onChange={(v) => onChange({ productCardBorder: v })} id="productCardBorder" />
              <ColorInput label="Title Color" value={settings.productTitleColor} onChange={(v) => onChange({ productTitleColor: v })} id="productTitleColor" />
              <ColorInput label="Price Color" value={settings.productPriceColor} onChange={(v) => onChange({ productPriceColor: v })} id="productPriceColor" />
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Live Preview</h3>
              <p className="text-indigo-100">See how your theme looks</p>
            </div>

            <div className="border rounded-xl p-6" style={{ backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily }}>
              <div className="text-center mb-6" style={{ color: settings.headingColor }}>
                <h2 style={{ color: settings.websiteNameColor }} className="text-3xl font-bold">{settings.heroTitle}</h2>
                <p className="mt-2" style={{ color: settings.textColor }}>{settings.heroSubtitle}</p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: settings.feature1Icon, title: settings.feature1Title, text: settings.feature1Text },
                  { icon: settings.feature2Icon, title: settings.feature2Title, text: settings.feature2Text },
                  { icon: settings.feature3Icon, title: settings.feature3Title, text: settings.feature3Text },
                  { icon: settings.feature4Icon, title: settings.feature4Title, text: settings.feature4Text },
                ].map((f, i) => (
                  <div key={i} className="text-center p-4 rounded-lg" style={{ backgroundColor: settings.featureCardBg, border: `1px solid ${settings.cardBorderColor}` }}>
                    <div className="text-3xl mb-2">{f.icon}</div>
                    <div className="font-semibold" style={{ color: settings.headingColor }}>{f.title}</div>
                    <div className="text-sm" style={{ color: settings.featureTextColor }}>{f.text}</div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  className="px-6 py-3 font-semibold shadow-lg"
                  style={{
                    backgroundColor: settings.buttonPrimaryBg,
                    color: settings.buttonPrimaryText,
                    borderRadius: settings.buttonRadius
                  }}
                >
                  {settings.heroButtonText}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                {previewMode ? 'Hide Preview' : 'Show Full Preview'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
        <button
          onClick={resetToDefault}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
        >
          🔄 Reset to Default
        </button>
        <button
          onClick={() => onChange(defaultTheme)}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
        >
          Reset (No Save)
        </button>
      </div>
    </div>
  );
}

export { defaultTheme };
export type { ThemeSettings };
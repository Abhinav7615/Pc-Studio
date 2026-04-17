'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface WeeklyScheduleItem {
  day: number;
  dayName: string;
  active: boolean;
  openTime: string;
  closeTime: string;
}

interface Settings {
  websiteName: string;
  websiteSubtitle?: string;
  whatsapp?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  bankAccountNumber?: string;
  upiId?: string;
  adminWhatsapp?: string;
  staffWhatsapp?: string;
  offlineShopAddress?: string;
  offlineShopGoogleMapsLink?: string;
  offlineShopCity?: string;
  offlineShopState?: string;
  offlineShopPincode?: string;
  offlineShopEnabled?: boolean;
  siteOpen?: boolean;
  scheduleEnabled?: boolean;
  alwaysOpen247?: boolean;
  globalOpenTime?: string;
  globalCloseTime?: string;
  closedPageTitle?: string;
  closedPageMessage?: string;
  weeklySchedule?: WeeklyScheduleItem[];
  referralEnabled?: boolean;
  referralCouponAmount?: number;
  referralCouponDays?: number;
  referralCouponUsageLimit?: number;
  inviteeDiscountAmount?: number;
  inviteeDiscountDays?: number;
  inviteeDiscountUsageLimit?: number;
  bargainCouponDays?: number;
  biddingCouponDays?: number;
  bargainEnabled?: boolean;
  biddingEnabled?: boolean;
  chatEnabled?: boolean;
  chatBotEnabled?: boolean;
  chatBotName?: string;
  chatBotIntroMessage?: string;
  chatJoinMessage?: string;
  chatEndMessage?: string;
  paymentVerificationStartTime?: string;
  paymentVerificationEndTime?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  websiteNameColor?: string;
  headerColor?: string;
  cardColor?: string;
  brandLogo?: string;
  fontFamily?: string;
  buttonRadius?: string;
  buttonPrimaryColor?: string;
  buttonSecondaryColor?: string;
  cardPadding?: string;
  headerHeight?: string;
  contactWhatsappColor?: string;
  contactEmailColor?: string;
  contactInfoEnabled?: boolean;
  freeShippingThreshold?: number;
  defaultShippingCharge?: number;
  stateShippingCharges?: Record<string, number>;
  // Consumer Interface Settings
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

const defaultWeekly: WeeklyScheduleItem[] = [
  { day: 0, dayName: 'Sunday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 1, dayName: 'Monday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 2, dayName: 'Tuesday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 3, dayName: 'Wednesday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 4, dayName: 'Thursday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 5, dayName: 'Friday', active: true, openTime: '09:00', closeTime: '18:00' },
  { day: 6, dayName: 'Saturday', active: true, openTime: '09:00', closeTime: '18:00' },
];

export default function AdminSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Settings>({ websiteName: '' });
  const [themeDraft, setThemeDraft] = useState<Partial<Settings>>({});
  const [isThemePreview, setIsThemePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const _defaultTheme = {
    primaryColor: '#2563eb',
    secondaryColor: '#9333ea',
    backgroundColor: '#f8fafc',
    textColor: '#111827',
    headerColor: '#ffffff',
    cardColor: '#ffffff',
    brandLogo: '',
    fontFamily: 'Arial, Helvetica, sans-serif',
    buttonRadius: '0.5rem',
    buttonPrimaryColor: '#2563eb',
    buttonSecondaryColor: '#9333ea',
    cardPadding: '1.25rem',
    headerHeight: '72px',
    websiteNameColor: '#111827',
    contactWhatsappColor: '#16a34a',
    contactEmailColor: '#1d4ed8',
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/business-settings');
      if (!res.ok) {
        setError('Failed to load settings');
        return;
      }
      const data = await res.json();
      setSettings({
        websiteName: data.websiteName || '',
        whatsapp: data.whatsapp || '',
        contactWhatsapp: data.contactWhatsapp || '',
        adminWhatsapp: data.adminWhatsapp || '',
        staffWhatsapp: data.staffWhatsapp || '',
        contactEmail: data.contactEmail || '',
        websiteNameColor: data.websiteNameColor || '#111827',
        contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
        contactEmailColor: data.contactEmailColor || '#1d4ed8',
        contactInfoEnabled: data.contactInfoEnabled ?? true,
        bankAccountNumber: data.bankAccountNumber || '',
        upiId: data.upiId || '',
        offlineShopAddress: data.offlineShopAddress || '',
        offlineShopCity: data.offlineShopCity || '',
        offlineShopState: data.offlineShopState || '',
        offlineShopPincode: data.offlineShopPincode || '',
        offlineShopGoogleMapsLink: data.offlineShopGoogleMapsLink || '',
        offlineShopEnabled: data.offlineShopEnabled || false,
        bargainEnabled: data.bargainEnabled ?? false,
        biddingEnabled: data.biddingEnabled ?? false,
        siteOpen: data.siteOpen ?? true,
        scheduleEnabled: data.scheduleEnabled ?? false,
        alwaysOpen247: data.alwaysOpen247 ?? true,
        globalOpenTime: data.globalOpenTime || '00:00',
        globalCloseTime: data.globalCloseTime || '23:59',
        closedPageTitle: data.closedPageTitle || 'Website Temporarily Closed',
        closedPageMessage: data.closedPageMessage || 'We are currently closed. Please visit again during working hours.',
        weeklySchedule: data.weeklySchedule?.length ? data.weeklySchedule : defaultWeekly,
        referralEnabled: data.referralEnabled ?? true,
        referralCouponAmount: data.referralCouponAmount ?? 100,
        referralCouponDays: data.referralCouponDays ?? 30,
        referralCouponUsageLimit: data.referralCouponUsageLimit ?? 1,
        paymentVerificationStartTime: data.paymentVerificationStartTime || '09:00',
        paymentVerificationEndTime: data.paymentVerificationEndTime || '17:00',
        inviteeDiscountAmount: data.inviteeDiscountAmount ?? 50,
        inviteeDiscountDays: data.inviteeDiscountDays ?? 30,
        inviteeDiscountUsageLimit: data.inviteeDiscountUsageLimit ?? 1,
        bargainCouponDays: data.bargainCouponDays ?? 3,
        biddingCouponDays: data.biddingCouponDays ?? 2,
        freeShippingThreshold: data.freeShippingThreshold ?? 0,
        defaultShippingCharge: data.defaultShippingCharge ?? 0,
        stateShippingCharges: (data.stateShippingCharges && typeof data.stateShippingCharges === 'object') 
          ? data.stateShippingCharges as Record<string, number>
          : {},
        chatEnabled: data.chatEnabled ?? true,
        chatBotEnabled: data.chatBotEnabled ?? true,
        chatBotName: data.chatBotName || 'ShopBot',
        chatBotIntroMessage: data.chatBotIntroMessage || '',
        chatJoinMessage: data.chatJoinMessage || 'An agent has joined your chat and will respond shortly.',
        chatEndMessage: data.chatEndMessage || 'Thank you for chatting with us. If you need anything else, we are here to help!',
        primaryColor: data.primaryColor || '#2563eb',
        secondaryColor: data.secondaryColor || '#9333ea',
        backgroundColor: data.backgroundColor || '#f8fafc',
        textColor: data.textColor || '#111827',
        headerColor: data.headerColor || '#ffffff',
        cardColor: data.cardColor || '#ffffff',
        brandLogo: data.brandLogo || '',
        fontFamily: data.fontFamily || 'Arial, Helvetica, sans-serif',
        buttonRadius: data.buttonRadius || '0.5rem',
        buttonPrimaryColor: data.buttonPrimaryColor || '#2563eb',
        buttonSecondaryColor: data.buttonSecondaryColor || '#9333ea',
        cardPadding: data.cardPadding || '1.25rem',
        headerHeight: data.headerHeight || '72px',
        // Consumer Interface Settings
        heroEnabled: data.heroEnabled ?? true,
        heroTitle: data.heroTitle || 'Welcome to Our Store',
        heroSubtitle: data.heroSubtitle || 'Discover amazing products at great prices',
        heroBgColor: data.heroBgColor || '#3b82f6',
        heroTextColor: data.heroTextColor || '#ffffff',
        heroButtonText: data.heroButtonText || 'Shop Now',
        heroButtonBg: data.heroButtonBg || '#ffffff',
        heroButtonTextColor: data.heroButtonTextColor || '#3b82f6',
        announcementEnabled: data.announcementEnabled ?? false,
        announcementText: data.announcementText || 'Announcement',
        announcementBgColor: data.announcementBgColor || '#10b981',
        announcementTextColor: data.announcementTextColor || '#ffffff',
        welcomeEnabled: data.welcomeEnabled ?? true,
        welcomeTitle: data.welcomeTitle || 'Welcome to Our Store',
        welcomeSubtitle: data.welcomeSubtitle || 'We offer the best refurbished computers with warranty',
        welcomeBgColor: data.welcomeBgColor || '#ffffff',
        welcomeTextColor: data.welcomeTextColor || '#1e293b',
        featuresEnabled: data.featuresEnabled ?? true,
        feature1Icon: data.feature1Icon || '🚚',
        feature1Title: data.feature1Title || 'Free Shipping',
        feature1Text: data.feature1Text || 'On orders over ₹1000',
        feature2Icon: data.feature2Icon || '🔒',
        feature2Title: data.feature2Title || 'Secure Payment',
        feature2Text: data.feature2Text || '100% secure checkout',
        feature3Icon: data.feature3Icon || '💯',
        feature3Title: data.feature3Title || 'Quality Assured',
        feature3Text: data.feature3Text || 'All products checked',
        feature4Icon: data.feature4Icon || '📞',
        feature4Title: data.feature4Title || '24/7 Support',
        feature4Text: data.feature4Text || 'Dedicated support team',
        featureBgColor: data.featureBgColor || '#f1f5f9',
        featureCardBg: data.featureCardBg || '#ffffff',
        featureTextColor: data.featureTextColor || '#475569',
        containerMaxWidth: data.containerMaxWidth || '1280px',
      });
      setThemeDraft({
        primaryColor: data.primaryColor || '#2563eb',
        secondaryColor: data.secondaryColor || '#9333ea',
        backgroundColor: data.backgroundColor || '#f8fafc',
        textColor: data.textColor || '#111827',
        headerColor: data.headerColor || '#ffffff',
        cardColor: data.cardColor || '#ffffff',
        contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
        contactEmailColor: data.contactEmailColor || '#1d4ed8',
        websiteNameColor: data.websiteNameColor || '#111827',
        brandLogo: data.brandLogo || '',
        fontFamily: data.fontFamily || 'Arial, Helvetica, sans-serif',
        buttonRadius: data.buttonRadius || '0.5rem',
        buttonPrimaryColor: data.buttonPrimaryColor || '#2563eb',
        buttonSecondaryColor: data.buttonSecondaryColor || '#9333ea',
        cardPadding: data.cardPadding || '1.25rem',
        headerHeight: data.headerHeight || '72px',
      });
      const previewFromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('themePreview') : null;
      const previewData = previewFromStorage ? JSON.parse(previewFromStorage) : null;

      setThemeDraft(
        previewData || {
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#9333ea',
          backgroundColor: data.backgroundColor || '#f8fafc',
          textColor: data.textColor || '#111827',
          headerColor: data.headerColor || '#ffffff',
          cardColor: data.cardColor || '#ffffff',
          websiteNameColor: data.websiteNameColor || '#111827',
          contactWhatsappColor: data.contactWhatsappColor || '#16a34a',
          contactEmailColor: data.contactEmailColor || '#1d4ed8',
        }
      );

      if (previewData) {
        setIsThemePreview(true);
      }
    } catch (err) {
      setError('Something went wrong loading settings. Please refresh the page.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      await fetchSettings();
    };
    loadSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const activeTheme = isThemePreview ? themeDraft : settings;
      if (!root || !activeTheme) return;

      if (activeTheme.primaryColor) root.style.setProperty('--primary-color', activeTheme.primaryColor);
      if (activeTheme.secondaryColor) root.style.setProperty('--secondary-color', activeTheme.secondaryColor);
      if (activeTheme.backgroundColor) root.style.setProperty('--background-color', activeTheme.backgroundColor);
      if (activeTheme.textColor) root.style.setProperty('--text-color', activeTheme.textColor);
      if (activeTheme.websiteNameColor) root.style.setProperty('--website-name-color', activeTheme.websiteNameColor);
      if (activeTheme.headerColor) root.style.setProperty('--header-color', activeTheme.headerColor);
      if (activeTheme.cardColor) root.style.setProperty('--card-color', activeTheme.cardColor);
    };

    applyTheme();
  }, [themeDraft, settings, isThemePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;

    setSettings({ ...settings, [target.name]: value });

    const themeKeys = [
      'primaryColor',
      'secondaryColor',
      'backgroundColor',
      'textColor',
      'websiteNameColor',
      'headerColor',
      'cardColor',
      'contactWhatsappColor',
      'contactEmailColor',
    ];

    if (themeKeys.includes(target.name)) {
      setThemeDraft({ ...themeDraft, [target.name]: value });
    }
  };

  const save = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const settingsToSave = {
      ...settings,
      chatBotIntroMessage: settings.chatBotIntroMessage ?? '',
      chatJoinMessage: settings.chatJoinMessage ?? '',
      chatEndMessage: settings.chatEndMessage ?? '',
      stateShippingCharges: settings.stateShippingCharges || {},
    };
    
    const res = await fetch('/api/business-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsToSave),
    });
    if (res.ok) {
      setError('');
      setSuccess('Settings saved successfully!');
      setIsThemePreview(false);
      window.localStorage.removeItem('themePreview');
      await fetchSettings();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setLoading(false);
  };

  const generateReferralCodes = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/generate-referral-codes', {
      method: 'POST',
    });
    if (res.ok) {
      setSuccess('Referral codes generated for existing users!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to generate referral codes');
    }
    setLoading(false);
  };

  const resetAllSettings = async () => {
    if (!resetPassword.trim()) {
      setError('Please enter your admin password');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      const res = await fetch('/api/business-settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });

      if (res.ok) {
        setSuccess('All settings have been reset to default values!');
        setShowResetModal(false);
        setResetPassword('');
        await fetchSettings();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset settings');
      }
    } catch (_error) {
      setError('An error occurred while resetting settings');
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2 text-slate-900">⚙️ Admin Settings Dashboard</h1>
          <p className="text-slate-600">Manage all site configuration from a centralized admin panel. Navigate through sections using tabs below.</p>
        </div>

        {/* Status Messages */}
        {error && <p className="text-red-700 mb-4 font-semibold bg-red-100 p-3 rounded-lg border border-red-300">{error}</p>}
        {success && <p className="text-emerald-700 mb-4 font-semibold bg-emerald-100 p-3 rounded-lg border border-emerald-300">{success}</p>}

        {/* Tab Navigation */}
        <div className="mb-8 bg-white rounded-t-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap gap-0 p-2 bg-gray-100">
            {[
              { id: 'business', label: '🏢 Business', icon: '🏢' },
              { id: 'features', label: '✨ Features', icon: '✨' },
              { id: 'bidding-bargain', label: '🏷️ Bidding & Bargain', icon: '🏷️' },
              { id: 'product-sharing', label: '📤 Product Sharing', icon: '📤' },
              { id: 'availability', label: '🕒 Availability', icon: '🕒' },
              { id: 'shipping', label: '🚚 Shipping & Payments', icon: '🚚' },
              { id: 'customization', label: '🎨 Customization', icon: '🎨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold text-sm md:text-base transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-b-2 ${activeTab === tab.id ? 'border-blue-600' : 'border-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-lg border border-t-0 border-gray-200 p-8">
          {/* BUSINESS SETTINGS TAB */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🏢 Business Settings</h2>
                <p className="text-gray-600 mb-6">Configure your website name, contact information, and offline shop details.</p>
              </div>

              {/* Website Configuration */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🌐 Website Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="websiteName"
                    value={settings.websiteName || ''}
                    onChange={handleChange}
                    placeholder="Website Name"
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    name="websiteSubtitle"
                    value={settings.websiteSubtitle || ''}
                    onChange={handleChange}
                    placeholder="Website Subtitle"
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                  />
                  <div className="text-sm flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-300">
                    <label htmlFor="websiteNameColor" className="min-w-max font-semibold">
                      Name Color:
                    </label>
                    <input
                      id="websiteNameColor"
                      name="websiteNameColor"
                      type="color"
                      value={settings.websiteNameColor || '#111827'}
                      onChange={handleChange}
                      className="h-8 w-12 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📱 Contact Information</h3>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="contactInfoEnabled"
                    checked={settings.contactInfoEnabled ?? true}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Contact Information</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ opacity: settings.contactInfoEnabled ? 1 : 0.5 }}>
                  <input
                    name="contactWhatsapp"
                    value={settings.contactWhatsapp || ''}
                    onChange={handleChange}
                    placeholder="Customer WhatsApp Number"
                    disabled={!settings.contactInfoEnabled}
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                  <input
                    name="contactEmail"
                    value={settings.contactEmail || ''}
                    onChange={handleChange}
                    placeholder="Customer Email"
                    disabled={!settings.contactInfoEnabled}
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                  <input
                    name="bankAccountNumber"
                    value={settings.bankAccountNumber || ''}
                    onChange={handleChange}
                    placeholder="Bank Account Number"
                    disabled={!settings.contactInfoEnabled}
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                  <input
                    name="upiId"
                    value={settings.upiId || ''}
                    onChange={handleChange}
                    placeholder="UPI ID"
                    disabled={!settings.contactInfoEnabled}
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                  />
                  <div className="text-sm flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-300">
                    <label htmlFor="contactWhatsappColor" className="min-w-max font-semibold">WhatsApp Color:</label>
                    <input
                      id="contactWhatsappColor"
                      name="contactWhatsappColor"
                      type="color"
                      value={settings.contactWhatsappColor || '#16a34a'}
                      onChange={handleChange}
                      disabled={!settings.contactInfoEnabled}
                      className="h-8 w-12 rounded cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  <div className="text-sm flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-300">
                    <label htmlFor="contactEmailColor" className="min-w-max font-semibold">Email Color:</label>
                    <input
                      id="contactEmailColor"
                      name="contactEmailColor"
                      type="color"
                      value={settings.contactEmailColor || '#1d4ed8'}
                      onChange={handleChange}
                      disabled={!settings.contactInfoEnabled}
                      className="h-8 w-12 rounded cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    websiteNameColor: '#111827',
                    contactWhatsappColor: '#16a34a',
                    contactEmailColor: '#1d4ed8',
                  })}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                >
                  Reset Colors
                </button>
              </div>

              {/* Offline Shop */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🏪 Offline Shop Settings</h3>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="offlineShopEnabled"
                    checked={settings.offlineShopEnabled || false}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Offline Shop</span>
                </label>

                <div className="grid grid-cols-1 gap-3" style={{ opacity: settings.offlineShopEnabled ? 1 : 0.5 }}>
                  <textarea
                    name="offlineShopAddress"
                    value={settings.offlineShopAddress || ''}
                    onChange={handleChange}
                    placeholder="Enter shop address"
                    disabled={!settings.offlineShopEnabled}
                    className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                    rows={3}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input name="offlineShopCity" value={settings.offlineShopCity || ''} onChange={handleChange} placeholder="City" disabled={!settings.offlineShopEnabled} className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50" />
                    <input name="offlineShopState" value={settings.offlineShopState || ''} onChange={handleChange} placeholder="State" disabled={!settings.offlineShopEnabled} className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50" />
                    <input name="offlineShopPincode" value={settings.offlineShopPincode || ''} onChange={handleChange} placeholder="Pincode" disabled={!settings.offlineShopEnabled} className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50" />
                  </div>
                  <input name="offlineShopGoogleMapsLink" value={settings.offlineShopGoogleMapsLink || ''} onChange={handleChange} placeholder="Google Maps Link (optional)" disabled={!settings.offlineShopEnabled} className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50" />
                </div>
              </div>
            </div>
          )}

          {/* FEATURES CONTROL TAB */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Feature Controls</h2>
                <p className="text-gray-600 mb-6">Enable or disable specific features available on your platform.</p>
              </div>

              {/* Live Chat & Bot */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">💬 Live Chat & Bot</h3>
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer">
                    <span className="text-gray-900 font-semibold">Enable Live Chat Support</span>
                    <input
                      type="checkbox"
                      name="chatEnabled"
                      checked={settings.chatEnabled ?? true}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer">
                    <span className="text-gray-900 font-semibold">Enable Automated Chatbot</span>
                    <input
                      type="checkbox"
                      name="chatBotEnabled"
                      checked={settings.chatBotEnabled ?? true}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Chatbot Name</label>
                      <input
                        type="text"
                        name="chatBotName"
                        value={settings.chatBotName || 'ShopBot'}
                        onChange={handleChange}
                        className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Welcome Message</label>
                      <textarea
                        name="chatBotIntroMessage"
                        value={settings.chatBotIntroMessage || ''}
                        onChange={handleChange}
                        rows={3}
                        className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Chat End Message</label>
                    <textarea
                      name="chatEndMessage"
                      value={settings.chatEndMessage || 'Thank you for chatting with us. If you need anything else, we are here to help!'}
                      onChange={handleChange}
                      rows={3}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Program */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🎁 Referral Program</h3>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="referralEnabled"
                    checked={settings.referralEnabled || false}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Referral Program</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Referrer Coupon Amount (₹)</label>
                    <input
                      type="number"
                      name="referralCouponAmount"
                      value={settings.referralCouponAmount || 100}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Validity (Days)</label>
                    <input
                      type="number"
                      name="referralCouponDays"
                      value={settings.referralCouponDays || 30}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit</label>
                    <input
                      type="number"
                      name="referralCouponUsageLimit"
                      value={settings.referralCouponUsageLimit || 1}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <strong>Invitee Discount Settings</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Discount Amount (₹)</label>
                    <input
                      type="number"
                      name="inviteeDiscountAmount"
                      value={settings.inviteeDiscountAmount || 50}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Validity (Days)</label>
                    <input
                      type="number"
                      name="inviteeDiscountDays"
                      value={settings.inviteeDiscountDays || 30}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit</label>
                    <input
                      type="number"
                      name="inviteeDiscountUsageLimit"
                      value={settings.inviteeDiscountUsageLimit || 1}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <strong>Bargain & Auction Coupon Validity</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bargain Coupon (Days)</label>
                    <input
                      type="number"
                      name="bargainCouponDays"
                      value={settings.bargainCouponDays ?? 3}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bidding Coupon (Days)</label>
                    <input
                      type="number"
                      name="biddingCouponDays"
                      value={settings.biddingCouponDays ?? 2}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🕒 Website Availability</h2>
                <p className="text-gray-600 mb-6">Control when your website is open to customers.</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <p className="text-sm text-yellow-900"><strong>⚠️ Important:</strong> Manual toggle on Admin Dashboard is the master control.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="scheduleEnabled"
                      checked={settings.scheduleEnabled ?? false}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                    <span className="text-gray-900 font-semibold">Enable Day-wise Schedule</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="alwaysOpen247"
                      checked={settings.alwaysOpen247 ?? true}
                      onChange={(e) => {
                        setSettings({ ...settings, alwaysOpen247: e.target.checked });
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-gray-900 font-semibold">24/7 Open</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Global Open Time</label>
                    <input
                      type="time"
                      name="globalOpenTime"
                      value={settings.globalOpenTime || '00:00'}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Global Close Time</label>
                    <input
                      type="time"
                      name="globalCloseTime"
                      value={settings.globalCloseTime || '23:59'}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-white font-semibold">Day</th>
                        <th className="px-4 py-2 text-left text-white font-semibold">Active</th>
                        <th className="px-4 py-2 text-left text-white font-semibold">Open</th>
                        <th className="px-4 py-2 text-left text-white font-semibold">Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(settings.weeklySchedule || []).map((day, idx) => (
                        <tr key={day.day} className="border-t bg-gray-50 hover:bg-gray-100">
                          <td className="px-4 py-3 text-gray-900 font-medium">{day.dayName}</td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={day.active}
                              onChange={(e) => {
                                const newSchedule = [...(settings.weeklySchedule || [])];
                                newSchedule[idx] = { ...newSchedule[idx], active: e.target.checked };
                                setSettings({ ...settings, weeklySchedule: newSchedule });
                              }}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={day.openTime}
                              onChange={(e) => {
                                const newSchedule = [...(settings.weeklySchedule || [])];
                                newSchedule[idx] = { ...newSchedule[idx], openTime: e.target.value };
                                setSettings({ ...settings, weeklySchedule: newSchedule });
                              }}
                              className="border border-gray-300 p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={day.closeTime}
                              onChange={(e) => {
                                const newSchedule = [...(settings.weeklySchedule || [])];
                                newSchedule[idx] = { ...newSchedule[idx], closeTime: e.target.value };
                                setSettings({ ...settings, weeklySchedule: newSchedule });
                              }}
                              className="border border-gray-300 p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Closed Page Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Page Title</label>
                    <input
                      type="text"
                      name="closedPageTitle"
                      value={settings.closedPageTitle || ''}
                      onChange={handleChange}
                      placeholder="Website Temporarily Closed"
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Page Message</label>
                    <input
                      type="text"
                      name="closedPageMessage"
                      value={settings.closedPageMessage || ''}
                      onChange={handleChange}
                      placeholder="We are currently closed..."
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING & PAYMENTS TAB */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🚚 Shipping & Payments</h2>
                <p className="text-gray-600 mb-6">Configure shipping charges, payment verification, and related settings.</p>
              </div>

              {/* Shipping Settings */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📦 Shipping Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Free Shipping Threshold (₹)</label>
                    <input
                      type="number"
                      name="freeShippingThreshold"
                      value={settings.freeShippingThreshold || 0}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Default Shipping Charge (₹)</label>
                    <input
                      type="number"
                      name="defaultShippingCharge"
                      value={settings.defaultShippingCharge || 0}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Charge for unlisted states</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">State-wise Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'].map((state) => {
                    const stateCharges = settings.stateShippingCharges || {};
                    const charge = stateCharges[state] ?? '';
                    return (
                      <div key={state} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-700 min-w-[100px]">{state}:</label>
                        <div className="flex items-center">
                          <span className="text-gray-500">₹</span>
                          <input
                            type="number"
                            value={charge}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSettings({
                                ...settings,
                                stateShippingCharges: {
                                  ...(settings.stateShippingCharges || {}),
                                  [state]: value === '' ? 0 : parseFloat(value) || 0,
                                },
                              });
                            }}
                            placeholder="0"
                            className="border border-gray-300 p-1 rounded w-20 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                            min="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const allStates: Record<string, number> = {};
                      ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'].forEach(s => {
                        allStates[s] = 0;
                      });
                      setSettings({ ...settings, stateShippingCharges: allStates });
                    }}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 font-semibold"
                  >
                    Set All Free
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allStates: Record<string, number> = {};
                      ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'].forEach(s => {
                        allStates[s] = 100;
                      });
                      setSettings({ ...settings, stateShippingCharges: allStates });
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 font-semibold"
                  >
                    Set All ₹100
                  </button>
                </div>
              </div>

              {/* Payment Verification */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🕒 Payment Verification Time Slot</h3>
                <p className="text-gray-600 text-sm mb-4">Set the time slot when admin verifies customer payments.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Start Time</label>
                    <input
                      type="time"
                      name="paymentVerificationStartTime"
                      value={settings.paymentVerificationStartTime || '09:00'}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">End Time</label>
                    <input
                      type="time"
                      name="paymentVerificationEndTime"
                      value={settings.paymentVerificationEndTime || '17:00'}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMIZATION TAB */}
          {activeTab === 'customization' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🎨 Design & Customization</h2>
                <p className="text-gray-600 mb-6">Customize theme colors and consumer interface elements.</p>
              </div>

              {/* Theme Customization */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🎨 Theme Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Primary Color</label>
                    <input type="color" name="primaryColor" value={settings.primaryColor || '#2563eb'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Secondary Color</label>
                    <input type="color" name="secondaryColor" value={settings.secondaryColor || '#9333ea'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Background Color</label>
                    <input type="color" name="backgroundColor" value={settings.backgroundColor || '#f8fafc'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Text Color</label>
                    <input type="color" name="textColor" value={settings.textColor || '#111827'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Header Color</label>
                    <input type="color" name="headerColor" value={settings.headerColor || '#ffffff'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Card Color</label>
                    <input type="color" name="cardColor" value={settings.cardColor || '#ffffff'} onChange={handleChange} className="w-full h-10 p-1 rounded border-2 border-gray-300 cursor-pointer" />
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const next = {
                        primaryColor: settings.primaryColor || '#2563eb',
                        secondaryColor: settings.secondaryColor || '#9333ea',
                        backgroundColor: settings.backgroundColor || '#f8fafc',
                        textColor: settings.textColor || '#111827',
                        websiteNameColor: settings.websiteNameColor || '#111827',
                        headerColor: settings.headerColor || '#ffffff',
                        cardColor: settings.cardColor || '#ffffff',
                      };
                      setThemeDraft(next);
                      setIsThemePreview(true);
                      window.localStorage.setItem('themePreview', JSON.stringify(next));
                    }}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                  >
                    Preview Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsThemePreview(false);
                      window.localStorage.removeItem('themePreview');
                    }}
                    className="px-5 py-2 bg-gray-400 text-gray-900 rounded-lg font-semibold hover:bg-gray-500"
                  >
                    Cancel Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultTheme = {
                        primaryColor: '#2563eb',
                        secondaryColor: '#9333ea',
                        backgroundColor: '#f8fafc',
                        textColor: '#111827',
                        websiteNameColor: '#111827',
                        headerColor: '#ffffff',
                        cardColor: '#ffffff',
                      };
                      setSettings({ ...settings, ...defaultTheme });
                      setThemeDraft(defaultTheme);
                      setIsThemePreview(true);
                    }}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Reset to Default
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-lg border-2 border-gray-300" style={{ backgroundColor: (isThemePreview ? themeDraft.backgroundColor : settings.backgroundColor) || '#f8fafc', color: (isThemePreview ? themeDraft.textColor : settings.textColor) || '#111827' }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: (isThemePreview ? themeDraft.primaryColor : settings.primaryColor) || '#2563eb' }}>Live Preview</h3>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: (isThemePreview ? themeDraft.cardColor : settings.cardColor) || '#ffffff', borderColor: (isThemePreview ? themeDraft.secondaryColor : settings.secondaryColor) || '#9333ea', borderWidth: 2 }}>            
                    <p className="mb-3">This area shows your theme colors in action.</p>
                    <button className="px-4 py-2 rounded font-semibold" style={{ backgroundColor: (isThemePreview ? themeDraft.primaryColor : settings.primaryColor) || '#2563eb', color: '#fff' }}>Call To Action</button>
                  </div>
                </div>
              </div>

              {/* Consumer Interface */}
              <div className="bg-gradient-to-br from-green-50 to-lime-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🏠 Consumer Interface</h3>
                <p className="text-gray-600 text-sm mb-6">Customize homepage sections displayed to customers.</p>

                <div className="space-y-6">
                  {/* Hero Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" name="heroEnabled" checked={settings.heroEnabled ?? true} onChange={handleChange} className="w-5 h-5" />
                      <h4 className="text-lg font-semibold text-gray-900">🎯 Hero Section</h4>
                    </div>
                    <div className="space-y-3 ml-8">
                      <input type="text" name="heroTitle" value={settings.heroTitle || 'Welcome to Our Store'} onChange={handleChange} disabled={!settings.heroEnabled} placeholder="Hero Title" className="border-2 border-gray-300 p-2 rounded w-full disabled:opacity-50" />
                      <input type="text" name="heroSubtitle" value={settings.heroSubtitle || 'Discover amazing products at great prices'} onChange={handleChange} disabled={!settings.heroEnabled} placeholder="Hero Subtitle" className="border-2 border-gray-300 p-2 rounded w-full disabled:opacity-50" />
                      <div className="flex gap-2">
                        <input type="color" name="heroBgColor" value={settings.heroBgColor || '#3b82f6'} onChange={handleChange} disabled={!settings.heroEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="color" name="heroTextColor" value={settings.heroTextColor || '#ffffff'} onChange={handleChange} disabled={!settings.heroEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="text" name="heroButtonText" value={settings.heroButtonText || 'Shop Now'} onChange={handleChange} disabled={!settings.heroEnabled} placeholder="Button Text" className="border-2 border-gray-300 p-2 rounded flex-1 disabled:opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Announcement Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" name="announcementEnabled" checked={settings.announcementEnabled ?? false} onChange={handleChange} className="w-5 h-5" />
                      <h4 className="text-lg font-semibold text-gray-900">📢 Announcement</h4>
                    </div>
                    <div className="space-y-2 ml-8">
                      <input type="text" name="announcementText" value={settings.announcementText || 'Announcement'} onChange={handleChange} disabled={!settings.announcementEnabled} placeholder="Announcement text" className="border-2 border-gray-300 p-2 rounded w-full disabled:opacity-50" />
                      <div className="flex gap-2">
                        <input type="color" name="announcementBgColor" value={settings.announcementBgColor || '#10b981'} onChange={handleChange} disabled={!settings.announcementEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="color" name="announcementTextColor" value={settings.announcementTextColor || '#ffffff'} onChange={handleChange} disabled={!settings.announcementEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Welcome Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" name="welcomeEnabled" checked={settings.welcomeEnabled ?? true} onChange={handleChange} className="w-5 h-5" />
                      <h4 className="text-lg font-semibold text-gray-900">👋 Welcome</h4>
                    </div>
                    <div className="space-y-2 ml-8">
                      <input type="text" name="welcomeTitle" value={settings.welcomeTitle || 'Welcome to Our Store'} onChange={handleChange} disabled={!settings.welcomeEnabled} placeholder="Welcome Title" className="border-2 border-gray-300 p-2 rounded w-full disabled:opacity-50" />
                      <textarea name="welcomeSubtitle" value={settings.welcomeSubtitle || 'We offer the best refurbished computers with warranty'} onChange={handleChange} disabled={!settings.welcomeEnabled} rows={2} placeholder="Welcome Subtitle" className="border-2 border-gray-300 p-2 rounded w-full disabled:opacity-50" />
                      <div className="flex gap-2">
                        <input type="color" name="welcomeBgColor" value={settings.welcomeBgColor || '#ffffff'} onChange={handleChange} disabled={!settings.welcomeEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="color" name="welcomeTextColor" value={settings.welcomeTextColor || '#1e293b'} onChange={handleChange} disabled={!settings.welcomeEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input type="checkbox" name="featuresEnabled" checked={settings.featuresEnabled ?? true} onChange={handleChange} className="w-5 h-5" />
                      <h4 className="text-lg font-semibold text-gray-900">⭐ Features Section</h4>
                    </div>
                    <div className="ml-8 space-y-3">
                      <div className="flex gap-2">
                        <input type="color" name="featureBgColor" value={settings.featureBgColor || '#f1f5f9'} onChange={handleChange} disabled={!settings.featuresEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="color" name="featureCardBg" value={settings.featureCardBg || '#ffffff'} onChange={handleChange} disabled={!settings.featuresEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                        <input type="color" name="featureTextColor" value={settings.featureTextColor || '#475569'} onChange={handleChange} disabled={!settings.featuresEnabled} className="w-12 h-8 disabled:opacity-50 cursor-pointer" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          { icon: 'feature1Icon', title: 'feature1Title', text: 'feature1Text', defaultIcon: '🚚', defaultTitle: 'Free Shipping', defaultText: 'On orders over ₹1000' },
                          { icon: 'feature2Icon', title: 'feature2Title', text: 'feature2Text', defaultIcon: '🔒', defaultTitle: 'Secure Payment', defaultText: '100% secure checkout' },
                          { icon: 'feature3Icon', title: 'feature3Title', text: 'feature3Text', defaultIcon: '💯', defaultTitle: 'Quality Assured', defaultText: 'All products checked' },
                          { icon: 'feature4Icon', title: 'feature4Title', text: 'feature4Text', defaultIcon: '📞', defaultTitle: '24/7 Support', defaultText: 'Dedicated support team' }
                        ].map((feature, idx) => (
                          <div key={idx} className="border border-gray-200 p-2 rounded bg-gray-50">
                            <div className="flex gap-2 mb-2">
                              <input type="text" name={feature.icon} value={String(settings[feature.icon as keyof Settings] || feature.defaultIcon)} onChange={handleChange} disabled={!settings.featuresEnabled} placeholder="Icon" className="border border-gray-300 p-1 rounded w-10 text-center text-sm disabled:opacity-50" />
                              <input type="text" name={feature.title} value={String(settings[feature.title as keyof Settings] || feature.defaultTitle)} onChange={handleChange} disabled={!settings.featuresEnabled} placeholder="Title" className="border border-gray-300 p-1 rounded flex-1 text-sm disabled:opacity-50" />
                            </div>
                            <input type="text" name={feature.text} value={String(settings[feature.text as keyof Settings] || feature.defaultText)} onChange={handleChange} disabled={!settings.featuresEnabled} placeholder="Description" className="border border-gray-300 p-1 rounded w-full text-sm disabled:opacity-50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Layout & Reset */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">📐 Container Width</label>
                        <select name="containerMaxWidth" value={settings.containerMaxWidth || '1280px'} onChange={handleChange} className="border-2 border-gray-300 p-2 rounded w-full bg-white text-gray-900">
                          <option value="1024px">Small (1024px)</option>
                          <option value="1280px">Medium (1280px)</option>
                          <option value="1536px">Large (1536px)</option>
                          <option value="100%">Full Width</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">🔄 Reset Sections</label>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" onClick={() => setSettings({...settings, heroEnabled: true, heroTitle: 'Welcome to Our Store', heroSubtitle: 'Discover amazing products at great prices', heroBgColor: '#3b82f6', heroTextColor: '#ffffff', heroButtonText: 'Shop Now'})} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 font-semibold">Hero</button>
                          <button type="button" onClick={() => setSettings({...settings, announcementEnabled: false, announcementText: 'Announcement', announcementBgColor: '#10b981', announcementTextColor: '#ffffff'})} className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 font-semibold">Announcement</button>
                          <button type="button" onClick={() => setSettings({...settings, welcomeEnabled: true, welcomeTitle: 'Welcome to Our Store', welcomeSubtitle: 'We offer the best refurbished computers with warranty', welcomeBgColor: '#ffffff', welcomeTextColor: '#1e293b'})} className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 font-semibold">Welcome</button>
                          <button type="button" onClick={() => setSettings({...settings, featuresEnabled: true, feature1Icon: '🚚', feature1Title: 'Free Shipping', feature1Text: 'On orders over ₹1000', feature2Icon: '🔒', feature2Title: 'Secure Payment', feature2Text: '100% secure checkout', feature3Icon: '💯', feature3Title: 'Quality Assured', feature3Text: 'All products checked', feature4Icon: '📞', feature4Title: '24/7 Support', feature4Text: 'Dedicated support team', featureBgColor: '#f1f5f9', featureCardBg: '#ffffff', featureTextColor: '#475569'})} className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 font-semibold">Features</button>
                          <button type="button" onClick={() => setSettings({...settings, heroEnabled: true, heroTitle: 'Welcome to Our Store', heroSubtitle: 'Discover amazing products at great prices', heroBgColor: '#3b82f6', heroTextColor: '#ffffff', heroButtonText: 'Shop Now', announcementEnabled: false, announcementText: 'Announcement', announcementBgColor: '#10b981', announcementTextColor: '#ffffff', welcomeEnabled: true, welcomeTitle: 'Welcome to Our Store', welcomeSubtitle: 'We offer the best refurbished computers with warranty', welcomeBgColor: '#ffffff', welcomeTextColor: '#1e293b', featuresEnabled: true, feature1Icon: '🚚', feature1Title: 'Free Shipping', feature1Text: 'On orders over ₹1000', feature2Icon: '🔒', feature2Title: 'Secure Payment', feature2Text: '100% secure checkout', feature3Icon: '💯', feature3Title: 'Quality Assured', feature3Text: 'All products checked', feature4Icon: '📞', feature4Title: '24/7 Support', feature4Text: 'Dedicated support team', featureBgColor: '#f1f5f9', featureCardBg: '#ffffff', featureTextColor: '#475569', containerMaxWidth: '1280px'})} className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-700 font-semibold">All</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BIDDING & BARGAIN TAB */}
          {activeTab === 'bidding-bargain' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🏷️ Bidding & Bargain Management</h2>
                <p className="text-gray-600 mb-6">Configure site-wide bidding and bargain offer settings for all products.</p>
              </div>

              {/* Bargain Offers */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🏷️ Bargain Offers Configuration</h3>
                <p className="text-gray-600 text-sm mb-4">Allow customers to submit offer prices on products.</p>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="bargainEnabled"
                    checked={settings.bargainEnabled ?? false}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Bargain Offers Site-Wide</span>
                </label>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  <p><strong>📌 How it works:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Customers can submit offer prices on products with bargaining enabled</li>
                    <li>You review offers and generate discount coupons for accepted bargains</li>
                    <li>Use the &quot;Bargain Coupon Days&quot; setting to control coupon validity</li>
                  </ul>
                </div>
              </div>

              {/* Bidding/Auction */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Bidding/Auction Configuration</h3>
                <p className="text-gray-600 text-sm mb-4">Allow customers to place bids on auction items.</p>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="biddingEnabled"
                    checked={settings.biddingEnabled ?? false}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Bidding/Auction Site-Wide</span>
                </label>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                  <p><strong>📌 How it works:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Set auction start and end dates on individual products</li>
                    <li>Customers can place bids during the auction period</li>
                    <li>Highest bidder wins and receives a discount coupon</li>
                    <li>Use the &quot;Bidding Coupon Days&quot; setting to control coupon validity</li>
                  </ul>
                </div>
              </div>

              {/* Coupon Validity */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🎫 Coupon Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bargain Coupon Days</label>
                    <input
                      type="number"
                      name="bargainCouponDays"
                      value={settings.bargainCouponDays ?? 3}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">How many days accepted bargain coupons remain valid</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bidding Coupon Days</label>
                    <input
                      type="number"
                      name="biddingCouponDays"
                      value={settings.biddingCouponDays ?? 2}
                      onChange={handleChange}
                      className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">How many days winning bid coupons remain valid</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT SHARING TAB */}
          {activeTab === 'product-sharing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📤 Product Sharing Management</h2>
                <p className="text-gray-600 mb-6">Control product sharing settings for customers and track shared products.</p>
              </div>

              {/* Product Sharing Settings */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">⚙️ Product Sharing Configuration</h3>
                <p className="text-gray-600 text-sm mb-4">Enable customers to share products with others via links and social media.</p>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    name="productSharingEnabled"
                    checked={(settings as any).productSharingEnabled ?? true}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Enable Product Sharing</span>
                </label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <p><strong>📌 Sharing Options Available:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Share direct product link</li>
                    <li>Share via WhatsApp</li>
                    <li>Share via Email</li>
                    <li>Share via Social Media (Facebook, Twitter, LinkedIn)</li>
                    <li>Generate QR code for product</li>
                    <li>Copy product link to clipboard</li>
                  </ul>
                </div>
              </div>

              {/* Sharing Analytics */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Sharing Analytics</h3>
                <p className="text-gray-600 text-sm mb-4">Track and analyze how many times products are shared and by which method.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 font-semibold">Track Share Count</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">📈</p>
                    <p className="text-xs text-gray-500 mt-2">Monitor total shares per product</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 font-semibold">Track Share Source</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">🔍</p>
                    <p className="text-xs text-gray-500 mt-2">See which platforms products are shared on</p>
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold">
                  📊 View Sharing Analytics
                </button>
              </div>

              {/* Admin Product Sharing */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">👨‍💼 Admin Product Sharing</h3>
                <p className="text-gray-600 text-sm mb-4">Share products with customers directly from the admin panel.</p>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-gray-900 rounded-lg hover:bg-indigo-50 font-semibold transition flex items-center gap-2">
                    📧 Share Product via Email
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-gray-900 rounded-lg hover:bg-indigo-50 font-semibold transition flex items-center gap-2">
                    💬 Share Product via WhatsApp
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-gray-900 rounded-lg hover:bg-indigo-50 font-semibold transition flex items-center gap-2">
                    🔗 Generate Shareable Link
                  </button>
                  <button className="w-full px-4 py-3 bg-white border-2 border-indigo-300 text-gray-900 rounded-lg hover:bg-indigo-50 font-semibold transition flex items-center gap-2">
                    📱 Generate QR Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 sticky bottom-6">
          <button onClick={save} disabled={loading} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-lg transition">
            ✅ Save All Settings
          </button>
          <button onClick={generateReferralCodes} disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg transition">
            🔄 Generate Referral Codes
          </button>
          {status === 'authenticated' && session?.user?.role === 'admin' && (session?.user as any)?.adminEmail === 'admin@example.com' && (
            <button onClick={() => setShowResetModal(true)} disabled={loading} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 shadow-lg transition">
              🔄 Reset All Settings
            </button>
          )}
        </div>

        {/* Reset Settings Modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Reset All Settings</h3>
              <p className="text-gray-600 mb-6">
                This action will reset ALL website settings to their default values. This cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Enter Main Admin Password
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-600"
                  onKeyPress={(e) => e.key === 'Enter' && resetAllSettings()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={resetAllSettings}
                  disabled={resetLoading || !resetPassword.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  {resetLoading ? 'Resetting...' : 'Reset All Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

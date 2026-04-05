'use client';

import { useCallback, useEffect, useState } from 'react';

interface WeeklyScheduleItem {
  day: number;
  dayName: string;
  active: boolean;
  openTime: string;
  closeTime: string;
}

interface Settings {
  websiteName: string;
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
  const [settings, setSettings] = useState<Settings>({ websiteName: '' });
  const [themeDraft, setThemeDraft] = useState<Partial<Settings>>({});
  const [isThemePreview, setIsThemePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        freeShippingThreshold: data.freeShippingThreshold ?? 0,
        defaultShippingCharge: data.defaultShippingCharge ?? 0,
        stateShippingCharges: (data.stateShippingCharges && typeof data.stateShippingCharges === 'object') 
          ? data.stateShippingCharges as Record<string, number>
          : {},
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <div className="max-w-[1300px] mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold mb-2 text-slate-900">⚙️ Admin Settings Dashboard</h1>
          <p className="text-sm text-slate-600">Manage all site configuration from a single centralized admin panel. Preview visual changes before applying.</p>
        </div>

        {error && <p className="text-red-700 mb-4 font-semibold bg-red-100 p-3 rounded-lg border border-red-300">{error}</p>}
        {success && <p className="text-emerald-700 mb-4 font-semibold bg-emerald-100 p-3 rounded-lg border border-emerald-300">{success}</p>}

        <div className="grid gap-6 xl:grid-cols-12">
          <section className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🌐 Website Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="websiteName"
                  value={settings.websiteName || ''}
                  onChange={handleChange}
                  placeholder="Website Name"
                  className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
                <div className="text-sm flex items-center gap-2">
                  <label htmlFor="websiteNameColor" className="min-w-max">
                    Website Name Color
                  </label>
                  <input
                    id="websiteNameColor"
                    name="websiteNameColor"
                    type="color"
                    value={settings.websiteNameColor || '#111827'}
                    onChange={handleChange}
                    className="h-10 w-12 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📱 Contact Information</h3>
              <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="contactInfoEnabled"
                  checked={settings.contactInfoEnabled ?? true}
                  onChange={handleChange}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-semibold">Enable Contact Information</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3" style={{ opacity: settings.contactInfoEnabled ? 1 : 0.5 }}>
                <input
                  name="contactWhatsapp"
                  value={settings.contactWhatsapp || ''}
                  onChange={handleChange}
                  placeholder="Customer Contact WhatsApp Number"
                  disabled={!settings.contactInfoEnabled}
                  className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                />
                <input
                  name="contactEmail"
                  value={settings.contactEmail || ''}
                  onChange={handleChange}
                  placeholder="Customer Contact Email"
                  disabled={!settings.contactInfoEnabled}
                  className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 disabled:opacity-50"
                />
                <div className="text-sm flex items-center gap-2">
                  <label htmlFor="contactWhatsappColor" className="min-w-max">WhatsApp text color</label>
                  <input
                    id="contactWhatsappColor"
                    name="contactWhatsappColor"
                    type="color"
                    value={settings.contactWhatsappColor || '#16a34a'}
                    onChange={handleChange}
                    disabled={!settings.contactInfoEnabled}
                    className="h-10 w-12 rounded"
                  />
                </div>
                <div className="text-sm flex items-center gap-2">
                  <label htmlFor="contactEmailColor" className="min-w-max">Email text color</label>
                  <input
                    id="contactEmailColor"
                    name="contactEmailColor"
                    type="color"
                    value={settings.contactEmailColor || '#1d4ed8'}
                    onChange={handleChange}
                    disabled={!settings.contactInfoEnabled}
                    className="h-10 w-12 rounded"
                  />
                </div>
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
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    websiteNameColor: '#111827',
                    contactWhatsappColor: '#16a34a',
                    contactEmailColor: '#1d4ed8',
                  })}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Reset Contact & Name Colors
                </button>
              </div>
            </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏪 Offline Shop Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="offlineShopEnabled"
                checked={settings.offlineShopEnabled || false}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="text-gray-900 font-semibold">Enable Offline Shop</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <textarea
              name="offlineShopAddress"
              value={settings.offlineShopAddress || ''}
              onChange={handleChange}
              placeholder="Enter Offline Shop Address"
              className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 w-full"
              rows={3}
            />
          </div>
          <input name="offlineShopCity" value={settings.offlineShopCity || ''} onChange={handleChange} placeholder="City" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
          <input name="offlineShopState" value={settings.offlineShopState || ''} onChange={handleChange} placeholder="State" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
          <input name="offlineShopPincode" value={settings.offlineShopPincode || ''} onChange={handleChange} placeholder="Pincode" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
          <input name="offlineShopGoogleMapsLink" value={settings.offlineShopGoogleMapsLink || ''} onChange={handleChange} placeholder="Google Maps Link (optional)" className="col-span-1 md:col-span-2 border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🕒 Website Close Schedule</h2>
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800"><strong>⚠️ Important:</strong> These settings only work when &quot;OPEN&quot; is selected on the Admin Dashboard.</p>
          <p className="text-sm text-yellow-800 mt-1">The manual toggle (Open/Close Site) from the Dashboard is the master control. If the site is manually CLOSED there, it will always show as closed to customers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer">
            <input
              type="checkbox"
              name="scheduleEnabled"
              checked={settings.scheduleEnabled ?? false}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <span className="text-gray-900 font-semibold">Enable Day-wise Schedule</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-green-100 rounded-lg border border-green-300 cursor-pointer">
            <input
              type="checkbox"
              name="alwaysOpen247"
              checked={settings.alwaysOpen247 ?? true}
              onChange={(e) => {
                setSettings({ ...settings, alwaysOpen247: e.target.checked });
              }}
              className="w-5 h-5"
            />
            <span className="text-gray-900 font-semibold">24/7 Open (Ignore Schedule)</span>
          </label>
          <div className="md:col-span-2 text-sm text-gray-600">
            <p><strong>Choose one of these:</strong></p>
            <p>• <strong>24/7 Open:</strong> Website stays open all day (recommended for quick setup)</p>
            <p>• <strong>Day-wise Schedule:</strong> Set custom hours for each day of the week (use the table below)</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Global Open Time (fallback only)</label>
            <input
              type="time"
              name="globalOpenTime"
              value={settings.globalOpenTime || '00:00'}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
            />
            <p className="text-xs text-gray-500 mt-1">Used only if 24/7 and day-wise schedule are both disabled</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Global Close Time (fallback only)</label>
            <input
              type="time"
              name="globalCloseTime"
              value={settings.globalCloseTime || '23:59'}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 focus:outline-none focus:border-blue-600"
            />
            <p className="text-xs text-gray-500 mt-1">Used only if 24/7 and day-wise schedule are both disabled</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p><strong>💡 How scheduling works:</strong></p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>If <strong>&quot;24/7 Open&quot;</strong> is enabled → Website always stays open</li>
            <li>If <strong>&quot;Day-wise Schedule&quot;</strong> is enabled → Uses the table below (set hours for each day)</li>
            <li>If both are disabled → Uses Global Open/Close times above</li>
            <li>If <strong>Admin Dashboard</strong> shows &quot;CLOSED&quot; → Website is closed for all customers (regardless of settings)</li>
          </ol>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-white font-semibold">Day</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Active</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Open</th>
                <th className="px-3 py-2 text-left text-white font-semibold">Close</th>
              </tr>
            </thead>
            <tbody>
              {(settings.weeklySchedule || []).map((day, idx) => (
                <tr key={day.day} className="border-t bg-gray-50 hover:bg-gray-100">
                  <td className="px-3 py-2 text-gray-900 font-medium">{day.dayName}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={(e) => {
                        const newSchedule = [...(settings.weeklySchedule || [])];
                        newSchedule[idx] = { ...newSchedule[idx], active: e.target.checked };
                        setSettings({ ...settings, weeklySchedule: newSchedule });
                      }}
                      className="w-5 h-5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => {
                        const newSchedule = [...(settings.weeklySchedule || [])];
                        newSchedule[idx] = { ...newSchedule[idx], openTime: e.target.value };
                        setSettings({ ...settings, weeklySchedule: newSchedule });
                      }}
                      className="border border-gray-300 p-1 rounded bg-white text-gray-900"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => {
                        const newSchedule = [...(settings.weeklySchedule || [])];
                        newSchedule[idx] = { ...newSchedule[idx], closeTime: e.target.value };
                        setSettings({ ...settings, weeklySchedule: newSchedule });
                      }}
                      className="border border-gray-300 p-1 rounded bg-white text-gray-900"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Closed Page Title</label>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Closed Page Message</label>
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

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎁 Referral Program Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer">
              <input
                type="checkbox"
                name="referralEnabled"
                checked={settings.referralEnabled || false}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="text-gray-900 font-semibold">Enable Referral Program</span>
            </label>
          </div>

          <h3 className="md:col-span-2 text-lg font-semibold mt-4 text-gray-900">💳 Referrer Coupon Settings</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Coupon Amount (₹)</label>
            <input
              type="number"
              name="referralCouponAmount"
              value={settings.referralCouponAmount || 100}
              onChange={handleChange}
              placeholder="100"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="0"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">Amount given to referrer when their invitee joins</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Validity (Days)</label>
            <input
              type="number"
              name="referralCouponDays"
              value={settings.referralCouponDays || 30}
              onChange={handleChange}
              placeholder="30"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="1"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">How long the coupon is valid after creation</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit</label>
            <input
              type="number"
              name="referralCouponUsageLimit"
              value={settings.referralCouponUsageLimit || 1}
              onChange={handleChange}
              placeholder="1"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="1"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">How many times the coupon can be used</p>
          </div>

          <h3 className="md:col-span-2 text-lg font-semibold mt-4 text-gray-900">🎉 Invitee Discount Settings</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Discount Amount (₹)</label>
            <input
              type="number"
              name="inviteeDiscountAmount"
              value={settings.inviteeDiscountAmount || 50}
              onChange={handleChange}
              placeholder="50"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="0"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">Discount given to new customer using invitation code</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Validity (Days)</label>
            <input
              type="number"
              name="inviteeDiscountDays"
              value={settings.inviteeDiscountDays || 30}
              onChange={handleChange}
              placeholder="30"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="1"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">How long the coupon is valid after creation</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit</label>
            <input
              type="number"
              name="inviteeDiscountUsageLimit"
              value={settings.inviteeDiscountUsageLimit || 1}
              onChange={handleChange}
              placeholder="1"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="1"
            />
            <p className="text-sm text-gray-700 font-medium mt-1">How many times the coupon can be used</p>
          </div>

          <div className="md:col-span-2 mt-3 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">🕒 Payment Verification Time Slot (भुगतान सत्यापन समय)</h3>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Verification Start Time (प्रारंभ समय)</label>
            <input
              type="time"
              name="paymentVerificationStartTime"
              value={settings.paymentVerificationStartTime || '09:00'}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900"
            />
            <p className="text-sm text-gray-700 mt-1">Admin starts verifying payments from this time</p>

            <label className="block text-sm font-semibold text-gray-900 mt-3 mb-2">Verification End Time (समाप्ति समय)</label>
            <input
              type="time"
              name="paymentVerificationEndTime"
              value={settings.paymentVerificationEndTime || '17:00'}
              onChange={handleChange}
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900"
            />
            <p className="text-sm text-gray-700 mt-1">Admin stops verifying payments after this time</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚚 Shipping Charges by State</h2>
        <p className="text-gray-600 text-sm mb-4">Set shipping charges for different Indian states. Leave empty or 0 for free shipping.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              name="freeShippingThreshold"
              value={settings.freeShippingThreshold || 0}
              onChange={handleChange}
              placeholder="0"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping (0 = disabled)</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Default Shipping Charge (₹)</label>
            <input
              type="number"
              name="defaultShippingCharge"
              value={settings.defaultShippingCharge || 0}
              onChange={handleChange}
              placeholder="0"
              className="border-2 border-gray-300 p-3 rounded-lg w-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Charge for states not listed below</p>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800"><strong>💡 How it works:</strong></p>
          <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
            <li>If order total &gt; Free Shipping Threshold → Free shipping</li>
            <li>If state is listed below → Use that state's charge</li>
            <li>Otherwise → Use Default Shipping Charge</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
          {['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'].map((state) => {
            const stateCharges = settings.stateShippingCharges || {};
            const charge = stateCharges[state] ?? '';
            return (
              <div key={state} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 min-w-[120px]">{state}:</label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">₹</span>
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
                    className="border border-gray-300 p-2 rounded w-20 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const allStates: Record<string, number> = {};
              ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir', 'Goa', 'Assam', 'Puducherry', 'Chandigarh', 'Other'].forEach(s => {
                allStates[s] = 0;
              });
              setSettings({ ...settings, stateShippingCharges: allStates });
            }}
            className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            Set All to Free (₹0)
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
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Set All to ₹100
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎨 Theme Customization & Preview</h2>
        <p className="text-gray-700 mb-4">Customize your brand colors for the website. Click Preview to try without saving, then Save Settings to apply permanently.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Primary Color</label>
            <input type="color" name="primaryColor" value={settings.primaryColor || '#2563eb'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Secondary Color</label>
            <input type="color" name="secondaryColor" value={settings.secondaryColor || '#9333ea'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Background Color</label>
            <input type="color" name="backgroundColor" value={settings.backgroundColor || '#f8fafc'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Text Color</label>
            <input type="color" name="textColor" value={settings.textColor || '#111827'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Header Color</label>
            <input type="color" name="headerColor" value={settings.headerColor || '#ffffff'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Card Color</label>
            <input type="color" name="cardColor" value={settings.cardColor || '#ffffff'} onChange={handleChange} className="w-full h-10 p-1 rounded border" />
          </div>
        </div>

        <div className="mt-4">
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
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 mr-3"
          >
            Preview Theme
          </button>
          <button
            type="button"
            onClick={() => {
              setIsThemePreview(false);
              setThemeDraft({
                primaryColor: settings.primaryColor || '#2563eb',
                secondaryColor: settings.secondaryColor || '#9333ea',
                backgroundColor: settings.backgroundColor || '#f8fafc',
                textColor: settings.textColor || '#111827',
                websiteNameColor: settings.websiteNameColor || '#111827',
                headerColor: settings.headerColor || '#ffffff',
                cardColor: settings.cardColor || '#ffffff',
              });
              window.localStorage.removeItem('themePreview');
            }}
            className="px-5 py-2 bg-gray-400 text-gray-900 rounded-lg font-semibold hover:bg-gray-500 mr-3"
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
            Reset Theme
          </button>
        </div>

        <div className="mt-6 p-4 rounded-lg border border-gray-300" style={{ backgroundColor: (isThemePreview ? themeDraft.backgroundColor : settings.backgroundColor) || '#f8fafc', color: (isThemePreview ? themeDraft.textColor : settings.textColor) || '#111827' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: (isThemePreview ? themeDraft.primaryColor : settings.primaryColor) || '#2563eb' }}>Live Preview</h3>
          <div className="p-4 rounded-lg" style={{ backgroundColor: (isThemePreview ? themeDraft.cardColor : settings.cardColor) || '#ffffff', borderColor: (isThemePreview ? themeDraft.secondaryColor : settings.secondaryColor) || '#9333ea', borderWidth: 1 }}>            
            <p style={{ marginBottom: 12 }}>This preview area uses selected theme colors. Save settings to apply across the site.</p>
            <button className="px-4 py-2 rounded" style={{ backgroundColor: (isThemePreview ? themeDraft.primaryColor : settings.primaryColor) || '#2563eb', color: '#fff' }}>Call To Action</button>
          </div>
        </div>
      </div>

      </section>

      <aside className="xl:col-span-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🧾 Quick Preview Helper</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>1. Configure colors and settings from each section.</li>
          <li>2. Click <strong>Preview Theme</strong> to apply live preview to site.</li>
          <li>3. Browse user pages in another tab to validate customer interface preview.</li>
          <li>4. Click <strong>Save Settings</strong> to persist theme site-wide.</li>
        </ul>
        <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200">
          <p className="text-sm font-medium text-slate-800">Current mode: {isThemePreview ? 'Preview' : 'Saved'}</p>
          <p className="mt-2 text-xs text-slate-600">Preview values are stored locally until saved or canceled.</p>
        </div>
      </aside>
    </div>

    <div className="mt-8 flex gap-4">
      <button onClick={save} disabled={loading} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md">
        ✅ Save Settings
      </button>
      <button onClick={generateReferralCodes} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md">
        🔄 Generate Referral Codes
      </button>
    </div>
  </div>
</div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface Settings {
  websiteName: string;
  whatsapp?: string;
  contactEmail?: string;
  bankAccountNumber?: string;
  upiId?: string;
  offlineShopAddress?: string;
  offlineShopCity?: string;
  offlineShopState?: string;
  offlineShopPincode?: string;
  offlineShopEnabled?: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({ websiteName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    const res = await fetch('/api/business-settings');
    const data = await res.json();
    setSettings(data);
  };

  useEffect(() => {
    const loadSettings = async () => {
      await fetchSettings();
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const save = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/business-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setError(''); // clear error
      setSuccess('Settings saved successfully!');
      await fetchSettings(); // refresh the data
      setTimeout(() => setSuccess(''), 3000); // clear success after 3s
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Business Settings</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="websiteName" value={settings.websiteName || ''} onChange={handleChange} placeholder="Website Name" className="border p-2 rounded" />
        <input name="whatsapp" value={settings.whatsapp || ''} onChange={handleChange} placeholder="WhatsApp" className="border p-2 rounded" />
        <input name="contactEmail" value={settings.contactEmail || ''} onChange={handleChange} placeholder="Contact Email" className="border p-2 rounded" />
        <input name="bankAccountNumber" value={settings.bankAccountNumber || ''} onChange={handleChange} placeholder="Bank Account" className="border p-2 rounded" />
        <input name="upiId" value={settings.upiId || ''} onChange={handleChange} placeholder="UPI ID" className="border p-2 rounded" />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Offline Shop Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="offlineShopEnabled"
                checked={settings.offlineShopEnabled || false}
                onChange={handleChange}
                className="mr-2"
              />
              Enable Offline Shop
            </label>
          </div>
          <div className="md:col-span-2">
            <textarea
              name="offlineShopAddress"
              value={settings.offlineShopAddress || ''}
              onChange={handleChange}
              placeholder="Offline Shop Address"
              className="border p-2 rounded w-full"
              rows={3}
            />
          </div>
          <input name="offlineShopCity" value={settings.offlineShopCity || ''} onChange={handleChange} placeholder="City" className="border p-2 rounded" />
          <input name="offlineShopState" value={settings.offlineShopState || ''} onChange={handleChange} placeholder="State" className="border p-2 rounded" />
          <input name="offlineShopPincode" value={settings.offlineShopPincode || ''} onChange={handleChange} placeholder="Pincode" className="border p-2 rounded" />
        </div>
      </div>
      <button onClick={save} disabled={loading} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
        Save Settings
      </button>
    </div>
  );
}
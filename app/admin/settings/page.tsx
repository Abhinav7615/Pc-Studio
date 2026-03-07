'use client';

import { useEffect, useState } from 'react';

interface Settings {
  websiteName: string;
  whatsapp?: string;
  contactEmail?: string;
  bankAccountNumber?: string;
  upiId?: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({ websiteName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/business-settings');
    const data = await res.json();
    setSettings(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
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
      <button onClick={save} disabled={loading} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
        Save Settings
      </button>
    </div>
  );
}
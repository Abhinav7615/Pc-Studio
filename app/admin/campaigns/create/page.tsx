'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaign() {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [zones, setZones] = useState<{ key: string; title: string }[]>([]);
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, zone }) });
      if (res.ok) return router.push('/admin/campaigns');
      const body = await res.json().catch(() => ({}));
      console.error('Create campaign failed:', res.status, body);
      alert('Create campaign failed: ' + (body.error || res.status));
    } catch (err) {
      console.error(err);
    }
  };

  // Load zones for select
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/zones');
        if (r.ok) {
          const data = await r.json();
          setZones((data || []).map((z: any) => ({ key: z.key, title: z.title || z.key })));
        }
      } catch (e) {
        console.warn('Failed to load zones', e);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Campaign</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">Zone</label>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full p-2 border">
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.key} value={z.key}>{z.title}</option>
            ))}
          </select>
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
      </form>
    </div>
  );
}

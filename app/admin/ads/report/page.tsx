'use client';

import { useEffect, useState } from 'react';

export default function AdsReportPage() {
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0,10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(format = 'json') {
    setLoading(true);
    try {
      const url = `/api/admin/ads/report?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${format === 'csv' ? '&format=csv' : ''}`;
      if (format === 'csv') {
        // trigger file download
        window.location.href = url;
        setLoading(false);
        return;
      }
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Ads Analytics</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-end gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">Start</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium">End</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="p-2 border" />
            </div>
            <div>
              <button onClick={() => load()} className="px-4 py-2 bg-blue-600 text-white rounded">Load</button>
            </div>
            <div>
              <button onClick={() => load('csv')} className="px-4 py-2 bg-green-600 text-white rounded">Download CSV</button>
            </div>
          </div>

          <div>
            {loading && <div>Loading...</div>}
            {!loading && (
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Ad</th>
                    <th className="p-2 text-left">Impressions</th>
                    <th className="p-2 text-left">Clicks</th>
                    <th className="p-2 text-left">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.adId} className="border-t">
                      <td className="p-2">{r.title}</td>
                      <td className="p-2">{r.impressions}</td>
                      <td className="p-2">{r.clicks}</td>
                      <td className="p-2">{(r.ctr * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

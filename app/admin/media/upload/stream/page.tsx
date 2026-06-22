"use client";

import React, { useState } from 'react';

export default function StreamUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleMultipartUpload() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'payment');
    fd.append('purpose', 'payment_screenshot');
    fd.append('uploadedBy', 'admin');

    try {
      const res = await fetch('/api/media/uploadMultipart', {
        method: 'POST',
        body: fd
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Stream Upload (Admin)</h1>
      <div className="space-y-4 max-w-md">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleMultipartUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload (multipart)'}
          </button>
        </div>
        {result && (
          <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

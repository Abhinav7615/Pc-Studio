"use client";

import React, { useState } from 'react';

export default function MediaUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name, contentType: file.type })
        });
        const json = await res.json();
        setResult(json);
      } catch (err) {
        setResult({ error: String(err) });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload Media (Admin)</h1>
      <div className="space-y-4 max-w-md">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {result && (
          <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

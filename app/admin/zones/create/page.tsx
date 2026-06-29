'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateZone() {
  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/zones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, title }) });
      if (res.ok) router.push('/admin/zones');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Zone</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1">Key (unique)</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
      </form>
    </div>
  );
}

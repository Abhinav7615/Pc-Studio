'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProvider() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [javascript, setJavascript] = useState('');
  const [allowJs, setAllowJs] = useState(false);
  const router = useRouter();

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, html, css, javascript, allowJs }) });
      if (res.ok) router.push('/admin/providers');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Provider</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">HTML snippet</label>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} className="w-full p-2 border h-24" />
        </div>
        <div>
          <label className="block mb-1">CSS (optional)</label>
          <textarea value={css} onChange={(e) => setCss(e.target.value)} className="w-full p-2 border h-20" />
        </div>
        <div>
          <label className="block mb-1">Javascript (optional)</label>
          <textarea value={javascript} onChange={(e) => setJavascript(e.target.value)} className="w-full p-2 border h-24" />
          <label className="inline-flex items-center mt-2"><input type="checkbox" checked={allowJs} onChange={(e) => setAllowJs(e.target.checked)} className="mr-2" /> Allow storing JS (unsafe)</label>
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </div>
      </form>
    </div>
  );
}

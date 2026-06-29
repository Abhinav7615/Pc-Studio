'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function EditProvider() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [provider, setProvider] = useState<any>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [javascript, setJavascript] = useState('');
  const [allowJs, setAllowJs] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/providers/${params.id}`);
        if (res.ok) {
        const data = await res.json();
        setProvider(data);
        setName(data.name || '');
        setType(data.type || '');
        setHtml(data.html || '');
        setCss(data.css || '');
        setJavascript(data.javascript || '');
        setAllowJs(!!data.javascript);
      }
    }
    if (status === 'authenticated') load();
  }, [status, params.id]);

  const save = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/admin/providers/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, html, css, javascript, allowJs }) });
    router.push('/admin/providers');
  };

  if (status === 'loading' || !provider) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Provider</h1>
      <form onSubmit={save} className="space-y-4">
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

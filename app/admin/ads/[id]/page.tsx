'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function EditAd() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [ad, setAd] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [zone, setZone] = useState('');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/ads/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setAd(data);
        setTitle(data.title || '');
        setZone(data.zone || '');
        setHtml(data.html || '');
      }
    }
    if (status === 'authenticated') load();
  }, [status, params.id]);

  const save = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/admin/ads/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, zone, html }) });
    router.push('/admin/ads');
  };

  if (status === 'loading' || !ad) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Ad</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">Zone</label>
          <input value={zone} onChange={(e) => setZone(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <label className="block mb-1">HTML</label>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} className="w-full p-2 border" rows={6} />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

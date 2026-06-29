'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function EditZone() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [zone, setZone] = useState<any>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/zones/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setZone(data);
        setTitle(data.title || '');
      }
    }
    if (status === 'authenticated') load();
  }, [status, params.id]);

  const save = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/admin/zones/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    router.push('/admin/zones');
  };

  if (status === 'loading' || !zone) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Zone</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

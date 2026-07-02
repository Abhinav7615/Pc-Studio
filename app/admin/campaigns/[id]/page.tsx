'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function EditCampaign() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [campaign, setCampaign] = useState<any>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/campaigns/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
        setName(data.name || '');
      }
    }
    if (status === 'authenticated') load();
  }, [status, params.id]);

  const save = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/admin/campaigns/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    router.push('/admin/campaigns');
  };

  if (status === 'loading' || !campaign) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Campaign</h1>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border" />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProviderAuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/providers/audit');
      if (res.ok) {
        const data = await res.json();
        setAudits(data || []);
      }
    }
    if (status === 'authenticated') load();
  }, [status]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Provider Audit Log</h1>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Provider</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Changed By</th>
              <th className="p-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-2">{a.provider?.name || String(a.provider) || '-'}</td>
                <td className="p-2">{a.action}</td>
                <td className="p-2">{a.changedByName || a.changedBy || '-'}</td>
                <td className="p-2"><pre className="whitespace-pre-wrap max-h-40 overflow-auto">{JSON.stringify(a.changes)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

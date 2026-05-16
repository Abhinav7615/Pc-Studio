'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface RecordingFile {
  _id: string;
  filename: string;
  length: number;
  contentType: string;
  uploadDate: string;
  metadata?: { originalName?: string; folder?: string };
  url?: string;
}

export default function AdminCallRecordingsPage() {
  const { data: session, status } = useSession();
  const [recordings, setRecordings] = useState<RecordingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/upload/list?folder=call-recordings&type=audio');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to load recordings');
      }
      const data = await res.json();
      setRecordings(data.files || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadRecordings();
    }
  }, [status, loadRecordings]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen p-6 bg-slate-50">Loading recordings...</div>;
  }

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3">Only admin and staff users can view call recordings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Call Recordings</h1>
              <p className="mt-1 text-sm text-slate-600">Review and play saved admin voice call recordings.</p>
            </div>
            <button onClick={loadRecordings} className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Refresh list</button>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6">
          {recordings.length === 0 ? (
            <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-200 text-slate-700">No recordings found. Recordings appear here after an admin saves a call.</div>
          ) : (
            recordings.map((recording) => (
              <div key={recording._id} className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{recording.metadata?.originalName || recording.filename}</h2>
                    <p className="mt-1 text-sm text-slate-500">Uploaded: {new Date(recording.uploadDate).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2 text-right text-sm text-slate-500">
                    <p>{recording.length} bytes</p>
                    <p>{recording.contentType}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <audio controls className="w-full" src={recording.url} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

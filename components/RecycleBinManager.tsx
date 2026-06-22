'use client';

import { useState } from 'react';

type DeletedMediaItem = {
  _id: string;
  originalMetadataId?: string | null;
  fileId?: string | null;
  fileName: string;
  fileSize?: number;
  category?: string;
  purpose?: string;
  deletedAt: string;
  deletedBy?: string;
  reason?: string;
  linkedObjects?: {
    productId?: string;
    orderId?: string;
    userId?: string;
    ticketId?: string;
  };
  recoveredAt?: string | null;
  permanentlyDeletedAt?: string | null;
};

export default function RecycleBinManager({ initialItems }: { initialItems: DeletedMediaItem[] }) {
  const [items, setItems] = useState<DeletedMediaItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRecover = async (item: DeletedMediaItem) => {
    if (!item.originalMetadataId) {
      setError('This item cannot be recovered because metadata is missing.');
      return;
    }
    setError('');
    setSuccess('');
    setLoadingId(item._id);

    try {
      const res = await fetch('/api/media/recycle-bin/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadataId: item.originalMetadataId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to recover media');
      }

      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setSuccess(`Recovered ${item.fileName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recover media');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedMediaItem) => {
    if (!confirm(`Permanently delete ${item.fileName}? This cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setLoadingId(item._id);

    try {
      const res = await fetch('/api/media/permanent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedId: item._id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to permanently delete media');
      }

      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setSuccess(`Permanently deleted ${item.fileName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to permanently delete media');
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-100 border border-red-200 p-4 text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-100 border border-green-200 p-4 text-green-700">{success}</div>
      )}
      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          No deleted items in the recycle bin.
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{item.fileName}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {item.category || 'other'} • {item.purpose || 'other'}
                  </div>
                  {item.deletedBy && (
                    <div className="mt-1 text-xs text-gray-400">Deleted by: {item.deletedBy}</div>
                  )}
                </div>
                <div className="text-sm text-gray-600">Deleted: {formatDate(item.deletedAt)}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.originalMetadataId ? (
                  <button
                    type="button"
                    disabled={loadingId === item._id}
                    onClick={() => handleRecover(item)}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {loadingId === item._id ? 'Recovering...' : 'Recover'}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={loadingId === item._id}
                  onClick={() => handlePermanentDelete(item)}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {loadingId === item._id ? 'Removing...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

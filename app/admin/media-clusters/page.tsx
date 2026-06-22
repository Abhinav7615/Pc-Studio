'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type ClusterStatus = {
  status: 'ok' | 'warning' | 'critical';
  storage: {
    usedMB: number;
    limitMB: number;
    usagePercent: number;
    totalFiles: number;
    avgFileSizeMB: string;
  };
  breakdown: {
    byType: Array<{ type: string; count: number; sizeMB: string }>;
    totalChunks: number;
    orphanedChunks: number;
    incompleteUploads: number;
    filesOlderThan90Days: number;
  };
  cleanup: {
    canCleanupOrphaned: boolean;
    canCleanupIncomplete: boolean;
    canCleanupOld: boolean;
    estimatedSpaceFreeable: string;
  };
  recommendations: string[];
};

type PrimaryFile = {
  _id: string;
  filename: string;
  length: number;
  contentType: string;
  uploadDate: string;
  metadata?: Record<string, unknown>;
};

type MediaMetadataItem = {
  _id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  category: string;
  purpose: string;
  status: string;
  uploadedAt: string;
  deletedAt?: string;
};

export default function MediaClustersAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryStatus, setPrimaryStatus] = useState<ClusterStatus | null>(null);
  const [mediaStatus, setMediaStatus] = useState<ClusterStatus | null>(null);
  const [primaryFiles, setPrimaryFiles] = useState<PrimaryFile[]>([]);
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadataItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'primary' | 'media'>('overview');

  const canAccess = useMemo(() => {
    return status === 'authenticated' && session?.user && (session.user.role === 'admin' || session.user.role === 'staff');
  }, [session, status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const loadStatus = async () => {
    setStatusLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/media-clusters?type=status');
      if (!res.ok) {
        throw new Error('Failed to load cluster status');
      }
      const data = await res.json();
      setPrimaryStatus(data.primaryStatus || null);
      setMediaStatus(data.mediaStatus || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load cluster status');
    } finally {
      setStatusLoading(false);
    }
  };

  const loadPrimaryFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/media-clusters?type=primary-files');
      if (!res.ok) {
        throw new Error('Failed to load primary cluster files');
      }
      const data = await res.json();
      setPrimaryFiles(data.files || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load primary cluster files');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/media-clusters?type=metadata');
      if (!res.ok) {
        throw new Error('Failed to load media metadata');
      }
      const data = await res.json();
      setMediaMetadata(data.items || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load media metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadStatus();
      loadPrimaryFiles();
      loadMediaMetadata();
    }
  }, [canAccess, refreshKey]);

  const refreshAll = () => setRefreshKey((value) => value + 1);

  const handleDeletePrimaryFile = async (filename: string) => {
    if (!confirm(`Delete primary cluster file "${filename}"?`)) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/media-clusters?type=primary-file&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete file');
      }
      await loadPrimaryFiles();
    } catch (err) {
      console.error(err);
      setError('Failed to delete primary cluster file');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteMediaMetadata = async (metadataId: string) => {
    if (!confirm('Permanently delete media metadata and its stored file?')) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/media-clusters?type=media&metadataId=${encodeURIComponent(metadataId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete media metadata');
      }
      await loadMediaMetadata();
      await loadStatus();
    } catch (err) {
      console.error(err);
      setError('Failed to delete media metadata');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!canAccess) {
    return <div className="min-h-screen flex items-center justify-center p-8">Checking permissions...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Cluster Storage & Media Management</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              View both MongoDB clusters, browse stored media and media metadata, and delete old files when required.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshAll}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Primary Cluster</h2>
                <p className="text-sm text-slate-500">App storage and fallback primary file bucket</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${primaryStatus?.status === 'critical' ? 'bg-red-100 text-red-700' : primaryStatus?.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {primaryStatus?.status.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            {statusLoading ? (
              <p className="text-sm text-slate-500">Loading primary cluster stats...</p>
            ) : primaryStatus ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Used storage</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{primaryStatus.storage.usedMB.toFixed(2)} MB</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total files</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{primaryStatus.storage.totalFiles}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Usage</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{primaryStatus.storage.usagePercent}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Breakdown</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {primaryStatus.breakdown.byType.map((item) => (
                      <div key={item.type} className="flex justify-between">
                        <span>{item.type}</span>
                        <span>{item.count} files, {item.sizeMB} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">Primary cluster statistics unavailable.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Media Cluster</h2>
                <p className="text-sm text-slate-500">Dedicated media DB for GridFS and metadata</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${mediaStatus?.status === 'critical' ? 'bg-red-100 text-red-700' : mediaStatus?.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {mediaStatus?.status.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            {statusLoading ? (
              <p className="text-sm text-slate-500">Loading media cluster stats...</p>
            ) : mediaStatus ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Used storage</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{mediaStatus.storage.usedMB.toFixed(2)} MB</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total files</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{mediaStatus.storage.totalFiles}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Usage</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{mediaStatus.storage.usagePercent}%</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Breakdown</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {mediaStatus.breakdown.byType.map((item) => (
                      <div key={item.type} className="flex justify-between">
                        <span>{item.type}</span>
                        <span>{item.count} files, {item.sizeMB} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">Media cluster statistics unavailable.</p>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab('overview')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedTab === 'overview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('primary')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedTab === 'primary' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Primary Cluster Files
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('media')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedTab === 'media' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Media Metadata
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {selectedTab === 'primary' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Primary Cluster Files</h3>
            <p className="text-sm text-slate-500 mb-4">Browse the most recent files stored in the primary cluster's GridFS bucket.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Filename</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Size</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Uploaded</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {primaryFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No files found in primary cluster.</td>
                    </tr>
                  ) : primaryFiles.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-4 text-slate-900">{item.filename}</td>
                      <td className="px-4 py-4 text-slate-600">{item.contentType || 'unknown'}</td>
                      <td className="px-4 py-4 text-slate-600">{(item.length / (1024 * 1024)).toFixed(2)} MB</td>
                      <td className="px-4 py-4 text-slate-600">{new Date(item.uploadDate).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={deleteLoading}
                          onClick={() => handleDeletePrimaryFile(item.filename)}
                          className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'media' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Media Metadata</h3>
            <p className="text-sm text-slate-500 mb-4">Browse dedicated media metadata stored in the media cluster and delete orphaned or old records.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Media</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Category / Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Size</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Uploaded</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mediaMetadata.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No media metadata records found.</td>
                    </tr>
                  ) : mediaMetadata.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-4 text-slate-900">{item.fileName}</td>
                      <td className="px-4 py-4 text-slate-600">{item.category} / {item.purpose}</td>
                      <td className="px-4 py-4 text-slate-600">{(item.fileSize / (1024 * 1024)).toFixed(2)} MB</td>
                      <td className="px-4 py-4 text-slate-600">{item.status}</td>
                      <td className="px-4 py-4 text-slate-600">{new Date(item.uploadedAt).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={deleteLoading}
                          onClick={() => handleDeleteMediaMetadata(item._id)}
                          className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

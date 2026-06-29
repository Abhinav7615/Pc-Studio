'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreateAd() {
  const router = useRouter();
  const { id } = useParams() as { id?: string };
  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    title: '',
    zone: 'default',
    type: 'html' as 'html' | 'image' | 'video' | 'iframe' | 'native' | 'js',
    html: '',
    image: '',
    video: '',
    iframeSrc: '',
    js: '',
    targetUrl: '',
    status: 'draft' as 'draft' | 'active' | 'disabled' | 'expired',
    priority: 0,
    weight: 1,
    campaignId: '',
    provider: '',
    rotationStrategy: 'weighted' as 'random' | 'weighted' | 'round_robin' | 'sequential',
    frequencyCap: 0,
    cooldownSeconds: 0,
    startDate: '',
    endDate: '',
    targeting: {
      countries: [] as string[],
      devices: [] as string[],
      loggedInOnly: false,
    },
    notes: '',
  });

  const [zones, setZones] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [videoFiles, setVideoFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    async function loadZones() {
      try {
        const res = await fetch('/api/admin/zones');
        if (res.ok) {
          const data = await res.json();
          setZones(data);
        }
      } catch (err) {
        console.error('Failed to load zones', err);
      }
    }
    if (status === 'authenticated') loadZones();
  }, [status]);

  useEffect(() => {
    async function loadMediaFiles() {
      try {
        const imageRes = await fetch('/api/upload/list?type=image&limit=200');
        if (imageRes.ok) {
          const data = await imageRes.json();
          setImageFiles(data.files || []);
        }
      } catch (err) {
        console.error('Failed to load image files', err);
      }
    }
    if (status === 'authenticated') loadMediaFiles();
  }, [status]);

  useEffect(() => {
    async function loadVideoFiles() {
      try {
        const videoRes = await fetch('/api/upload/list?type=video&limit=200');
        if (videoRes.ok) {
          const data = await videoRes.json();
          setVideoFiles(data.files || []);
        }
      } catch (err) {
        console.error('Failed to load video files', err);
      }
    }
    if (status === 'authenticated') loadVideoFiles();
  }, [status]);

  useEffect(() => {
    if (id) {
      async function loadAd() {
        try {
          const res = await fetch(`/api/admin/ads/${id}`);
          if (res.ok) {
            const data = await res.json();
            setForm(data);
          }
        } catch (err) {
          console.error('Failed to load ad', err);
          setError('Failed to load ad');
        }
      }
      loadAd();
    }
  }, [id]);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = id ? `/api/admin/ads/${id}` : '/api/admin/ads';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/ads');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save ad');
      }
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">{id ? 'Edit Ad' : 'Create New Ad'}</h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Ad title"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Zone *</label>
              <select
                required
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Zone</option>
                {zones.map((z: any) => (
                  <option key={z._id} value={z.key}>{z.title || z.key}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Type *</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="html">HTML</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="iframe">iFrame</option>
                <option value="native">Native</option>
                <option value="js">JavaScript</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {form.type === 'html' && (
            <div>
              <label className="block font-semibold mb-2">HTML Content</label>
              <textarea
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                rows={6}
                placeholder="Enter HTML content"
              />
            </div>
          )}

          {form.type === 'image' && (
            <div>
              <label className="block font-semibold mb-2">Image URL or Media File</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/image.png"
              />
              {imageFiles.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {imageFiles.map((file) => (
                    <button
                      type="button"
                      key={file._id}
                      onClick={() => setForm({ ...form, image: file.url })}
                      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-left shadow-sm transition hover:shadow-md"
                    >
                      <img
                        src={file.url}
                        alt={file.metadata?.originalName || file.filename}
                        className="h-24 w-full rounded-md object-cover"
                      />
                      <div className="mt-2 text-sm text-slate-700">
                        <p className="truncate font-medium">{file.metadata?.originalName || file.filename}</p>
                        <p className="text-xs text-slate-500">Click to use</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.type === 'video' && (
            <div>
              <label className="block font-semibold mb-2">Video URL or Media File</label>
              <input
                type="url"
                value={form.video}
                onChange={(e) => setForm({ ...form, video: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/video.mp4"
              />
              {videoFiles.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {videoFiles.map((file) => (
                    <button
                      type="button"
                      key={file._id}
                      onClick={() => setForm({ ...form, video: file.url })}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-2 text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative h-28 overflow-hidden rounded-md bg-slate-100">
                        <video
                          src={file.url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        <p className="truncate font-medium">{file.metadata?.originalName || file.filename}</p>
                        <p className="text-xs text-slate-500">Click to use</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.type === 'iframe' && (
            <div>
              <label className="block font-semibold mb-2">iFrame Source</label>
              <input
                type="url"
                value={form.iframeSrc}
                onChange={(e) => setForm({ ...form, iframeSrc: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="https://example.com/frame"
              />
            </div>
          )}

          {form.type === 'js' && (
            <div>
              <label className="block font-semibold mb-2">JavaScript Code</label>
              <textarea
                value={form.js}
                onChange={(e) => setForm({ ...form, js: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                rows={6}
                placeholder="Enter JavaScript code"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold mb-2">Target URL</label>
            <input
              type="url"
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/landing"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Weight</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Rotation Strategy</label>
              <select
                value={form.rotationStrategy}
                onChange={(e) => setForm({ ...form, rotationStrategy: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="weighted">Weighted</option>
                <option value="random">Random</option>
                <option value="round_robin">Round Robin</option>
                <option value="sequential">Sequential</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2">Frequency Cap (0=unlimited)</label>
              <input
                type="number"
                value={form.frequencyCap}
                onChange={(e) => setForm({ ...form, frequencyCap: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Cooldown (seconds)</label>
              <input
                type="number"
                value={form.cooldownSeconds}
                onChange={(e) => setForm({ ...form, cooldownSeconds: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">End Date</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Targeting Options</label>
            <div className="space-y-2 p-4 bg-gray-50 rounded border border-gray-300">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.targeting.loggedInOnly}
                  onChange={(e) => setForm({
                    ...form,
                    targeting: { ...form.targeting, loggedInOnly: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span>Logged In Users Only</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Internal notes about this ad"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (id ? 'Update Ad' : 'Create Ad')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/ads')}
              className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 

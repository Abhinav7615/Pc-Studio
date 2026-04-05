'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Content {
  _id: string;
  key: string;
  title: string;
  content: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt: string;
}

interface ContentForm {
  key: string;
  title: string;
  content: string;
  isActive: boolean;
  displayOrder: number;
}

const initialFormState: ContentForm = {
  key: '',
  title: '',
  content: '',
  isActive: true,
  displayOrder: 1000,
};

export default function AdminContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ContentForm>(initialFormState);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  const fetchContents = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      const res = await fetch('/api/content', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as Array<Partial<Content>>;
        const normalized: Content[] = data.map((item) => ({
          _id: item._id || '',
          key: item.key || '',
          title: item.title || '',
          content: item.content || '',
          isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
          displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : 1000,
          updatedAt: item.updatedAt || new Date().toISOString(),
        }));
        setContents(normalized);
      } else if (res.status === 401) {
        setError('Unauthorized. Please login as admin/staff.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load contents');
      }
    } catch (err) {
      setError('Failed to fetch contents.');
      console.error(err);
    }
  }, [status]);

  useEffect(() => {
    const loadContents = async () => {
      await fetchContents();
    };
    loadContents();
  }, [status, fetchContents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    const url = editingKey ? `/api/content/${editingKey}` : '/api/content';
    const method = editingKey ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(initialFormState);
        setEditingKey(null);
        fetchContents();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (key: string) => {
    if (!confirm('Delete content?')) return;
    try {
      const res = await fetch(`/api/content/${key}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchContents();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete content');
      }
    } catch (err) {
      setError('Failed to delete content');
      console.error(err);
    }
  };

  const toggleActive = async (item: Content) => {
    try {
      const res = await fetch(`/api/content/${item.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: item.title,
          content: item.content,
          isActive: !item.isActive,
          displayOrder: item.displayOrder ?? 1000,
        }),
      });

      if (res.ok) {
        fetchContents();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to toggle active state');
      }
    } catch (err) {
      setError('Failed to toggle active state');
      console.error(err);
    }
  };

  const filteredContents = contents.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      c.key.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.content.toLowerCase().includes(term)
    );
  });

  const startEdit = (c: Content) => {
    setEditingKey(c.key);
    setForm({
      key: c.key,
      title: c.title,
      content: c.content,
      isActive: c.isActive ?? true,
      displayOrder: c.displayOrder ?? 1000,
    });
    setSelectedContent(c);
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status !== 'authenticated' || !session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p>Please log in with an admin or staff account to manage content.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">📝 Content Management</h1>
      <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingKey ? '✏️ Edit' : '➕ Add'} Content</h2>
        {error && <p className="text-red-600 mb-4 font-semibold bg-red-50 p-3 rounded border border-red-200">{error}</p>}
        <div className="grid grid-cols-1 gap-4 mt-2">
          <input
            name="key"
            value={form.key}
            onChange={handleChange}
            placeholder="Content Key (e.g., homepage-hero)"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
            disabled={!!editingKey}
          />
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
          />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={Boolean(form.isActive)}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <input
              name="displayOrder"
              type="number"
              value={form.displayOrder ?? 1000}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              placeholder="Display Order"
              className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Content (HTML allowed)"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 h-32"
          />
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={submit}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md"
          >
            {editingKey ? '✅ Update' : '✅ Create'}
          </button>
          {editingKey && (
            <button
              onClick={() => { setEditingKey(null); setForm(initialFormState); }}
              className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 shadow-md"
            >
              ❌ Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Search Content</label>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by key, title, or content"
            className="border-2 border-gray-300 p-3 rounded-lg w-full sm:w-80 focus:outline-none focus:border-blue-600"
          />
        </div>
        {selectedContent && (
          <div className="w-full sm:w-[25rem] bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
            <h3 className="text-lg font-bold mb-2">Preview: {selectedContent.title}</h3>
            <div className="text-sm text-gray-700 mb-2">Key: {selectedContent.key}</div>
            <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
            <div className="mt-2 text-xs text-gray-500">Updated: {new Date(selectedContent.updatedAt).toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full table-auto">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-white">📌 Key</th>
              <th className="px-6 py-3 text-left font-semibold text-white">📄 Title</th>
              <th className="px-6 py-3 text-left font-semibold text-white">⏱️ Order</th>
              <th className="px-6 py-3 text-left font-semibold text-white">🔋 Active</th>
              <th className="px-6 py-3 text-left font-semibold text-white">⏰ Last Updated</th>
              <th className="px-6 py-3 text-left font-semibold text-white">🔧 Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContents.map(c => (
              <tr key={c._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{c.key}</td>
                <td className="px-6 py-4 text-gray-900">{c.title}</td>
                <td className="px-6 py-4 text-gray-900">{c.displayOrder}</td>
                <td className="px-6 py-4 text-gray-900">{c.isActive ? '✅' : '❌'}</td>
                <td className="px-6 py-4 text-gray-900">{new Date(c.updatedAt).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(c)} className={`mr-3 font-semibold ${c.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}>
                    {c.isActive ? '🔒 Disable' : '✅ Enable'}
                  </button>
                  <button onClick={() => startEdit(c)} className="mr-4 text-blue-600 font-semibold hover:text-blue-800">✏️ Edit</button>
                  <button onClick={() => remove(c.key)} className="text-red-600 font-semibold hover:text-red-800">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';

interface Content {
  _id: string;
  key: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function AdminContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ key: '', title: '', content: '' });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchContents = async () => {
    const res = await fetch('/api/content');
    const data = await res.json();
    setContents(data);
  };

  useEffect(() => {
    const loadContents = async () => {
      await fetchContents();
    };
    loadContents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    const url = editingKey ? `/api/content/${editingKey}` : '/api/content';
    const method = editingKey ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ key: '', title: '', content: '' });
      setEditingKey(null);
      fetchContents();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setLoading(false);
  };

  const remove = async (key: string) => {
    if (!confirm('Delete content?')) return;
    await fetch(`/api/content/${key}`, { method: 'DELETE' });
    fetchContents();
  };

  const startEdit = (c: Content) => {
    setEditingKey(c.key);
    setForm({ key: c.key, title: c.title, content: c.content });
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Content Management</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{editingKey ? 'Edit' : 'Add'} Content</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="grid grid-cols-1 gap-4 mt-2">
          <input
            name="key"
            value={form.key}
            onChange={handleChange}
            placeholder="Content Key (e.g., homepage-hero)"
            className="border p-2 rounded"
            disabled={!!editingKey}
          />
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="border p-2 rounded"
          />
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Content (HTML allowed)"
            className="border p-2 rounded h-32"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {editingKey ? 'Update' : 'Create'}
        </button>
        {editingKey && (
          <button
            onClick={() => { setEditingKey(null); setForm({ key: '', title: '', content: '' }); }}
            className="mt-4 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Key</th>
            <th className="border px-4 py-2">Title</th>
            <th className="border px-4 py-2">Last Updated</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contents.map(c => (
            <tr key={c._id}>
              <td className="border px-4 py-2">{c.key}</td>
              <td className="border px-4 py-2">{c.title}</td>
              <td className="border px-4 py-2">{new Date(c.updatedAt).toLocaleString()}</td>
              <td className="border px-4 py-2">
                <button onClick={() => startEdit(c)} className="mr-2 text-blue-600">Edit</button>
                <button onClick={() => remove(c.key)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
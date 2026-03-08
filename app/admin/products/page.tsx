'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  quantity: number;
  images: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };
    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const parsedValue = (name === 'originalPrice' || name === 'discountPercent' || name === 'quantity') ? (value === '' ? 0 : Number(value)) : value;
    setForm({ ...form, [name]: parsedValue });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({});
      setEditingId(null);
      await fetchProducts();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setForm(p);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Product Management</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{editingId ? 'Edit' : 'Add'} Product</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <input
            name="name"
            value={form.name || ''}
            onChange={handleChange}
            placeholder="Name"
            className="border p-2 rounded"
          />
          <input
            name="originalPrice"
            value={form.originalPrice || ''}
            onChange={handleChange}
            type="number"
            placeholder="Original Price"
            className="border p-2 rounded"
          />
          <input
            name="discountPercent"
            value={form.discountPercent || 0}
            onChange={handleChange}
            type="number"
            placeholder="Discount %"
            className="border p-2 rounded"
          />
          <input
            name="quantity"
            value={form.quantity || 0}
            onChange={handleChange}
            type="number"
            placeholder="Quantity"
            className="border p-2 rounded"
          />
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 rounded"
          />
          <input
            name="images"
            value={form.images?.join(',') || ''}
            onChange={(e) => setForm({ ...form, images: e.target.value.split(',') })}
            placeholder="Image URLs comma separated"
            className="border p-2 rounded col-span-1 md:col-span-2"
          />
          <div className="col-span-1 md:col-span-2">
            <label className="block mb-1">Upload images</label>
            <input type="file" accept="image/*" multiple onChange={async (e) => {
              setUploadError('');
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const uploaded: string[] = form.images ? [...form.images] : [];
              for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const fd = new FormData();
                fd.append('file', f);
                try {
                  const res = await fetch('/api/upload', { method: 'POST', body: fd });
                  const data = await res.json();
                  if (data.url) {
                    uploaded.push(data.url);
                  } else {
                    setUploadError(data.error || 'Upload failed');
                  }
                } catch (_err) {
                  setUploadError('Upload failed');
                }
              }
              setForm({ ...form, images: uploaded });
            }} />
            {uploadError && <p className="text-red-600">{uploadError}</p>}
            <div className="mt-2 flex gap-2 flex-wrap">
              {(form.images || []).map((img, idx) => (
                <div key={`${img}-${idx}`} className="w-24 h-24 border rounded overflow-hidden">
                  <Image src={img} alt={`img-${idx}`} width={96} height={96} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {editingId ? 'Update' : 'Create'}
        </button>
        {editingId && (
          <button
            onClick={() => { setEditingId(null); setForm({}); }}
            className="mt-4 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Discount</th>
            <th className="border px-4 py-2">Quantity</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p._id}>
              <td className="border px-4 py-2">{p.name}</td>
              <td className="border px-4 py-2">₹{p.originalPrice}</td>
              <td className="border px-4 py-2">{p.discountPercent}%</td>
              <td className="border px-4 py-2">{p.quantity}</td>
              <td className="border px-4 py-2">
                <button onClick={() => startEdit(p)} className="mr-2 text-blue-600">Edit</button>
                <button onClick={() => remove(p._id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
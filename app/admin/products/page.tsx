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
  videos?: string[];
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
    console.log(`Field ${name} changed to:`, parsedValue, 'type:', typeof parsedValue);
    setForm({ ...form, [name]: parsedValue });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    
    const formData = {
      ...form,
      quantity: form.quantity !== undefined && form.quantity !== null ? form.quantity : 0,
    };
    
    console.log('Submitting form data:', formData);
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
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
    console.log('Loading product for edit:', p);
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
            value={form.quantity !== undefined && form.quantity !== null ? String(form.quantity) : ''}
            onChange={handleChange}
            type="number"
            min="0"
            placeholder="Quantity (e.g., 100)"
            className="border p-2 rounded"
          />
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 rounded"
          />
          
          {/* Image Upload Section */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-semibold text-gray-900 mb-2">📸 Upload Multiple Images</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={async (e) => {
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
                      setUploadError(data.error || 'Image upload failed');
                    }
                  } catch (_err) {
                    setUploadError('Image upload failed');
                  }
                }
                setForm({ ...form, images: uploaded });
              }} 
              className="border p-2 rounded w-full"
            />
            {uploadError && <p className="text-red-600 mt-1">{uploadError}</p>}
            
            {/* Display uploaded images */}
            {(form.images || []).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">✅ {form.images?.length || 0} image(s) uploaded:</p>
                <div className="flex gap-2 flex-wrap">
                  {(form.images || []).map((img, idx) => (
                    <div key={`${img}-${idx}`} className="relative">
                      <Image src={img} alt={`img-${idx}`} width={96} height={96} className="w-24 h-24 object-cover rounded border-2 border-green-500" />
                      <button
                        onClick={() => {
                          const updated = form.images?.filter((_, i) => i !== idx) || [];
                          setForm({ ...form, images: updated });
                        }}
                        className="absolute top-0 right-0 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-semibold text-gray-900 mb-2">🎥 Upload Video (Max 1 minute)</label>
            <input 
              type="file" 
              accept="video/*" 
              onChange={async (e) => {
                setUploadError('');
                const file = e.target.files?.[0];
                if (!file) return;
                
                // Validate video duration (client-side check)
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = async () => {
                  if (video.duration > 60) {
                    setUploadError('❌ Video must be 1 minute or less');
                    return;
                  }
                  
                  // Upload video
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.url) {
                      const uploaded: string[] = form.videos ? [...form.videos] : [];
                      uploaded.push(data.url);
                      setForm({ ...form, videos: uploaded });
                    } else {
                      setUploadError(data.error || 'Video upload failed');
                    }
                  } catch (_err) {
                    setUploadError('Video upload failed');
                  }
                };
                video.src = URL.createObjectURL(file);
              }} 
              className="border p-2 rounded w-full"
            />
            {uploadError && <p className="text-red-600 mt-1">{uploadError}</p>}
            
            {/* Display uploaded video */}
            {(form.videos || []).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">✅ Video uploaded:</p>
                <div className="relative w-48 h-32 bg-black rounded border-2 border-green-500">
                  <video src={form.videos?.[0] || ''} controls className="w-full h-full" />
                  <button
                    onClick={() => {
                      setForm({ ...form, videos: [] });
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
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
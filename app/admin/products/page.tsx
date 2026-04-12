'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  discountPercent: number;
  gstPercent: number;
  quantity: number;
  images: string[];
  videos?: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [imageInputStatus, setImageInputStatus] = useState('No files chosen');
  const [videoInputStatus, setVideoInputStatus] = useState('No file chosen');

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
    const parsedValue = (name === 'originalPrice' || name === 'discountPercent' || name === 'gstPercent' || name === 'quantity') ? (value === '' ? 0 : Number(value)) : value;
    console.log(`Field ${name} changed to:`, parsedValue, 'type:', typeof parsedValue);
    setForm({ ...form, [name]: parsedValue });
  };

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p._id.toLowerCase().includes(q)
    );
  });

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
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">📦 Product Management</h1>
      <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingId ? '✏️ Edit' : '➕ Add'} Product</h2>
        {error && <p className="text-red-600 mb-4 font-semibold bg-red-50 p-3 rounded border border-red-200">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name || ''}
            onChange={handleChange}
            placeholder="Product Name"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="originalPrice"
            value={form.originalPrice || ''}
            onChange={handleChange}
            type="number"
            placeholder="Original Price"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="discountPercent"
            value={form.discountPercent || 0}
            onChange={handleChange}
            type="number"
            placeholder="Discount %"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="gstPercent"
            value={form.gstPercent || 0}
            onChange={handleChange}
            type="number"
            placeholder="GST %"
            min="0"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="quantity"
            value={form.quantity !== undefined && form.quantity !== null ? String(form.quantity) : ''}
            onChange={handleChange}
            type="number"
            min="0"
            placeholder="Quantity (e.g., 100)"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            placeholder="Product Description"
            className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 col-span-1 md:col-span-2"
          />
          
          {/* Image Upload Section */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-bold text-gray-900 mb-2 bg-blue-50 p-2 rounded border border-blue-200">📸 Upload Multiple Images</label>
            <p className="text-sm text-gray-800 mb-2">Minimum 1 image required. Restart upload अगर file नहीं दिख रहा हो।</p>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={async (e) => {
                setUploadError('');
                const files = e.target.files;
                if (!files || files.length === 0) {
                  setImageInputStatus('No files chosen');
                  return;
                }
                setImageInputStatus(`${files.length} file${files.length > 1 ? 's' : ''} selected`);
                const uploaded: string[] = form.images ? [...form.images] : [];
                for (let i = 0; i < files.length; i++) {
                  const f = files[i];
                  const fd = new FormData();
                  fd.append('file', f);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
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
            <p className="text-sm text-gray-800 mt-1">{imageInputStatus}</p>
            {uploadError && <p className="text-red-600 mt-1 font-semibold">{uploadError}</p>}
            
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
            <label className="block font-bold text-gray-900 mb-2 bg-blue-50 p-2 rounded border border-blue-200">🎥 Upload Video (Max 1 minute, MP4/WebM/MOV/AVI with Audio)</label>
            <p className="text-sm text-gray-800 mb-2">Audio जरूर हो और duration 60 सेकंड से कम। अगर info दिख नहीं रही है तो page reload करके retry करें।</p>
            <input 
              type="file" 
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi" 
              onChange={async (e) => {
                setUploadError('');
                const file = e.target.files?.[0];
                if (!file) {
                  setVideoInputStatus('No file chosen');
                  return;
                }
                setVideoInputStatus(`Selected: ${file.name}`);
                
                // Validate file type
                if (!file.type.startsWith('video/')) {
                  setUploadError('❌ Please select a valid video file (MP4 or WebM)');
                  return;
                }
                
                // Validate file size (max 100MB)
                const maxSize = 100 * 1024 * 1024;
                if (file.size > maxSize) {
                  setUploadError('❌ Video file too large. Max 100MB allowed');
                  return;
                }
                
                // Validate video duration and metadata
                const video = document.createElement('video');
                video.preload = 'metadata';
                let metadataLoaded = false;
                
                video.onloadedmetadata = async () => {
                  clearTimeout(validationTimeout);
                  metadataLoaded = true;
                  
                  if (video.duration > 60) {
                    setUploadError('❌ Video must be 1 minute or less (Duration: ' + Math.round(video.duration) + 's)');
                    return;
                  }
                  
                  // Upload video with audio
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                    const data = await res.json();
                    if (data.url) {
                      const uploaded: string[] = form.videos ? [...form.videos] : [];
                      uploaded.push(data.url);
                      setForm({ ...form, videos: uploaded });
                    } else {
                      setUploadError('❌ ' + (data.error || 'Video upload failed'));
                    }
                  } catch (err) {
                    console.error('Video upload error:', err);
                    setUploadError('❌ Video upload failed. Please try again.');
                  }
                };
                
                video.onerror = () => {
                  clearTimeout(validationTimeout);
                  if (!metadataLoaded) {
                    setUploadError('❌ Invalid video file. Please use MP4 or WebM format with audio codec');
                  }
                };
                
                // Set a timeout - allow more time for audio codec loading
                const validationTimeout = setTimeout(() => {
                  if (!metadataLoaded) {
                    // Try uploading anyway - file might have audio but slow to load metadata
                    console.log('Metadata timeout, proceeding with upload...');
                    const fd = new FormData();
                    fd.append('file', file);
                    fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.url) {
                          const uploaded: string[] = form.videos ? [...form.videos] : [];
                          uploaded.push(data.url);
                          setForm({ ...form, videos: uploaded });
                        } else {
                          setUploadError('❌ ' + (data.error || 'Video upload failed'));
                        }
                      })
                      .catch(err => {
                        console.error('Video upload error:', err);
                        setUploadError('❌ Video upload failed. Please try again.');
                      });
                  }
                }, 8000);
                
                video.src = URL.createObjectURL(file);
              }} 
              className="border p-2 rounded w-full"
            />
            <p className="text-sm text-gray-800 mt-1">{videoInputStatus}</p>
            {uploadError && <p className="text-red-600 mt-1 font-semibold">{uploadError}</p>}
            
            {/* Display uploaded video */}
            {(form.videos || []).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">✅ Video uploaded successfully (with audio):</p>
                <div className="relative w-48 h-32 bg-black rounded border-2 border-green-500 overflow-hidden">
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
          className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md transition"
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

      <div className="flex justify-between items-center mt-8 mb-3">
        <div className="text-gray-700 font-semibold">Products found: {filteredProducts.length}</div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name, description, or id"
          className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
        />
      </div>
      <table className="w-full table-auto border-collapse mt-2 bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
        <thead>
          <tr className="bg-gradient-to-r from-gray-700 to-gray-800">
            <th className="px-6 py-4 text-left font-semibold text-white">📝 Name</th>
            <th className="px-6 py-4 text-left font-semibold text-white">💰 Price</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🏷️ Discount</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🧾 GST</th>
            <th className="px-6 py-4 text-left font-semibold text-white">📦 Quantity</th>
            <th className="px-6 py-4 text-left font-semibold text-white">⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p, idx) => (
            <tr key={p._id} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-300 hover:bg-blue-50 transition`}>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.name}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">₹{p.originalPrice}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.discountPercent}%</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.gstPercent ?? 0}%</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.quantity}</td>
              <td className="px-6 py-4">
                <button onClick={() => startEdit(p)} className="mr-3 text-blue-600 font-semibold hover:text-blue-800">✏️ Edit</button>
                <button onClick={() => remove(p._id)} className="text-red-600 font-semibold hover:text-red-800">🗑️ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
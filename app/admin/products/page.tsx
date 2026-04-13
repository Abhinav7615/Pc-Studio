'use client';

import { useEffect, useState } from 'react';

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
  bargainEnabled?: boolean;
  biddingEnabled?: boolean;
  biddingStart?: string | Date;
  biddingEnd?: string | Date;
  bargainOffers?: Array<{ _id?: string; user?: string; email?: string; price: number; status: string; couponCode?: string; reservedUntil?: string | Date; reservationUsed?: boolean; createdAt: string | Date }>;
  bids?: Array<{ _id?: string; user?: string; email?: string; price: number; status: string; couponCode?: string; reservedUntil?: string | Date; reservationUsed?: boolean; createdAt: string | Date }>;
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
  const [adminProductDetail, setAdminProductDetail] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchProductDetails = async (id: string) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        setDetailError('Unable to load product details');
        return null;
      }
      const data = await res.json();
      return data as Product;
    } catch (error) {
      console.error(error);
      setDetailError('Unable to load product details');
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  const viewProductDetails = async (product: Product) => {
    const detail = await fetchProductDetails(product._id);
    if (detail) {
      setAdminProductDetail(detail);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    if (!adminProductDetail) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/products/${adminProductDetail._id}/offers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Unable to update offer');
      } else {
        setAdminProductDetail({ ...adminProductDetail, bargainOffers: data.bargainOffers });
      }
    } catch (error) {
      console.error(error);
      setDetailError('Unable to update offer');
    }
    setDetailLoading(false);
  };

  const handleBidAction = async (bidId: string, action: 'reject' | 'winner') => {
    if (!adminProductDetail) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/products/${adminProductDetail._id}/bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Unable to update bid');
      } else {
        setAdminProductDetail({ ...adminProductDetail, bids: data.bids });
      }
    } catch (error) {
      console.error(error);
      setDetailError('Unable to update bid');
    }
    setDetailLoading(false);
  };

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };
    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    let value: string | number | boolean = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.value;

    if (name === 'originalPrice' || name === 'discountPercent' || name === 'gstPercent' || name === 'quantity') {
      value = target.value === '' ? 0 : Number(target.value);
    }

    console.log(`Field ${name} changed to:`, value, 'type:', typeof value);
    setForm({ ...form, [name]: value });
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
      bargainEnabled: form.bargainEnabled || false,
      biddingEnabled: form.biddingEnabled || false,
      biddingStart: form.biddingStart ? new Date(form.biddingStart).toISOString() : undefined,
      biddingEnd: form.biddingEnd ? new Date(form.biddingEnd).toISOString() : undefined,
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
    setForm({
      ...p,
      biddingStart: p.biddingStart ? new Date(p.biddingStart).toISOString().slice(0, 16) : '',
      biddingEnd: p.biddingEnd ? new Date(p.biddingEnd).toISOString().slice(0, 16) : '',
    });
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
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50 col-span-1 md:col-span-2">
            <input
              type="checkbox"
              name="bargainEnabled"
              checked={form.bargainEnabled ?? false}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <span className="text-gray-900 font-semibold">Enable Bargain Offers for this product</span>
          </label>
          <label className="flex flex-col gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50 col-span-1 md:col-span-2">
            <span className="text-gray-900 font-semibold">Enable Bidding / Auction for this product</span>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="biddingEnabled"
                checked={form.biddingEnabled ?? false}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span className="text-gray-700">Turn on auction mode</span>
            </div>
            {form.biddingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <label className="flex flex-col text-gray-900">
                  <span className="text-sm font-medium mb-1">Auction Start</span>
                  <input
                    type="datetime-local"
                    name="biddingStart"
                    value={form.biddingStart ? String(form.biddingStart) : ''}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-600"
                  />
                </label>
                <label className="flex flex-col text-gray-900">
                  <span className="text-sm font-medium mb-1">Auction End</span>
                  <input
                    type="datetime-local"
                    name="biddingEnd"
                    value={form.biddingEnd ? String(form.biddingEnd) : ''}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-600"
                  />
                </label>
              </div>
            )}
          </label>
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
                      <img src={img} alt={`img-${idx}`} width={96} height={96} className="w-24 h-24 object-cover rounded border-2 border-green-500" />
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
            <p className="text-sm text-gray-800 mb-2">
              Audio जरूर हो और duration 60 सेकंड से कम।
              {process.env.NODE_ENV === 'production' ? ' Deployed site पर video max 50MB होती है।' : ' Local server पर max 100MB supported है।'}
              अगर info दिख नहीं रही है तो page reload करके retry करें।
            </p>
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
                
                const maxSize = process.env.NODE_ENV === 'production' ? 50 * 1024 * 1024 : 100 * 1024 * 1024;
                if (file.size > maxSize) {
                  const maxMB = process.env.NODE_ENV === 'production' ? 50 : 100;
                  setUploadError(`❌ Video file too large. Max ${maxMB}MB allowed`);
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
                  try {
                    const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': file.type,
                        'X-File-Name': file.name,
                        'X-File-Type': file.type,
                      },
                      body: file,
                      credentials: 'include',
                    });
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
                    fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': file.type,
                        'X-File-Name': file.name,
                        'X-File-Type': file.type,
                      },
                      body: file,
                      credentials: 'include',
                    })
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
            <th className="px-6 py-4 text-left font-semibold text-white">💬 Bargain</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🏁 Auction</th>
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
              <td className="px-6 py-4 text-gray-900 font-medium">{p.bargainEnabled ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.biddingEnabled ? 'Yes' : 'No'}</td>
              <td className="px-6 py-4">
                <button onClick={() => startEdit(p)} className="mr-3 text-blue-600 font-semibold hover:text-blue-800">✏️ Edit</button>
                <button onClick={() => remove(p._id)} className="mr-3 text-red-600 font-semibold hover:text-red-800">🗑️ Delete</button>
                <button onClick={() => viewProductDetails(p)} className="text-green-600 font-semibold hover:text-green-800">🔧 Manage</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {adminProductDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage {adminProductDetail.name}</h2>
                <p className="text-sm text-gray-600">Review all bargain offers and auction bids.</p>
              </div>
              <button onClick={() => setAdminProductDetail(null)} className="text-gray-500 hover:text-gray-900 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {detailError && <p className="text-red-600 font-semibold">{detailError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Bargain Status</p>
                  <p className="text-sm text-gray-700">Enabled: {adminProductDetail.bargainEnabled ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-700">Offers: {adminProductDetail.bargainOffers?.length ?? 0}</p>
                  {adminProductDetail.bargainOffers?.length ? (
                    <p className="text-sm text-gray-700">Highest: ₹{Math.max(...adminProductDetail.bargainOffers.map((o) => o.price || 0))}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Auction Status</p>
                  <p className="text-sm text-gray-700">Enabled: {adminProductDetail.biddingEnabled ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-700">Bids: {adminProductDetail.bids?.length ?? 0}</p>
                  <p className="text-sm text-gray-700">Start: {adminProductDetail.biddingStart ? new Date(adminProductDetail.biddingStart).toLocaleString() : 'Not set'}</p>
                  <p className="text-sm text-gray-700">End: {adminProductDetail.biddingEnd ? new Date(adminProductDetail.biddingEnd).toLocaleString() : 'Not set'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bargain Offers</h3>
                {!adminProductDetail.bargainOffers?.length ? (
                  <p className="text-sm text-gray-600">No offers have been submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Coupon</th>
                          <th className="px-3 py-2">Reserved Until</th>
                          <th className="px-3 py-2">Submitted</th>
                          <th className="px-3 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminProductDetail.bargainOffers
                          .slice()
                          .sort((a, b) => (b.price || 0) - (a.price || 0))
                          .map((offer) => (
                            <tr key={offer._id || `${offer.price}-${offer.createdAt}`} className="border-b border-gray-200">
                              <td className="px-3 py-2">₹{offer.price.toFixed(2)}</td>
                              <td className="px-3 py-2 capitalize">{offer.status}</td>
                              <td className="px-3 py-2 font-mono text-sm text-gray-700">{offer.couponCode || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{offer.reservedUntil ? new Date(offer.reservedUntil).toLocaleString() : '—'}</td>
                              <td className="px-3 py-2">{new Date(offer.createdAt).toLocaleString()}</td>
                              <td className="px-3 py-2 space-x-2">
                                {offer.status === 'pending' ? (
                                  <>
                                    <button onClick={() => handleOfferAction(offer._id!, 'accept')} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Accept</button>
                                    <button onClick={() => handleOfferAction(offer._id!, 'reject')} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">No action</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Bids</h3>
                {!adminProductDetail.bids?.length ? (
                  <p className="text-sm text-gray-600">No bids have been placed yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Coupon</th>
                          <th className="px-3 py-2">Reserved Until</th>
                          <th className="px-3 py-2">Submitted</th>
                          <th className="px-3 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminProductDetail.bids
                          .slice()
                          .sort((a, b) => (b.price || 0) - (a.price || 0))
                          .map((bid) => (
                            <tr key={bid._id || `${bid.price}-${bid.createdAt}`} className={`border-b border-gray-200 ${bid.status === 'winner' ? 'bg-green-50' : ''}`}>
                              <td className="px-3 py-2">₹{bid.price.toFixed(2)}</td>
                              <td className="px-3 py-2 capitalize">{bid.status}</td>
                              <td className="px-3 py-2 font-mono text-sm text-gray-700">{bid.couponCode || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{bid.reservedUntil ? new Date(bid.reservedUntil).toLocaleString() : '—'}</td>
                              <td className="px-3 py-2">{new Date(bid.createdAt).toLocaleString()}</td>
                              <td className="px-3 py-2 space-x-2">
                                {bid.status === 'active' ? (
                                  <>
                                    <button onClick={() => handleBidAction(bid._id!, 'winner')} className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Choose Winner</button>
                                    <button onClick={() => handleBidAction(bid._id!, 'reject')} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-500">No action</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
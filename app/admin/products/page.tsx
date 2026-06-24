'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DragDropUploader, UploadProgressData } from '@/components/Upload';

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
  categories?: string[];
  marketMode?: 'none' | 'bargain' | 'auction';
  status?: 'active' | 'out-of-stock' | 'new' | 'archived';
  bargainEnabled?: boolean;
  biddingEnabled?: boolean;
  biddingStart?: string | Date;
  biddingEnd?: string | Date;
  bargainOffers?: Array<{ _id?: string; user?: string; email?: string; price: number; status: string; couponCode?: string; reservedUntil?: string | Date; reservationUsed?: boolean; createdAt: string | Date }>;
  bids?: Array<{ _id?: string; user?: string; email?: string; price: number; status: string; couponCode?: string; reservedUntil?: string | Date; reservationUsed?: boolean; createdAt: string | Date }>;
  finalSellingPrice?: number;
  variants?: Array<any>;
}

interface StorageStatus {
  status: 'ok' | 'warning' | 'critical';
  storage: { usedMB: number; limitMB: number; usagePercent: number };
  recommendations: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({ marketMode: 'none', status: 'active', categories: ['all'], variants: [] });
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [unsavedUploads, setUnsavedUploads] = useState<string[]>([]);
    // Variant editing state
    const [variantDraft, setVariantDraft] = useState<any>({ sku: '', attributes: {}, price: '', stock: '', images: [] });
    const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null);
    const [variantUploadError, setVariantUploadError] = useState<string | null>(null);

    // Helper for attribute input
    const handleVariantAttributeChange = (key: string, value: string) => {
      setVariantDraft((prev: any) => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));
    };

    // Add or update variant
    const handleSaveVariant = () => {
      if (!variantDraft.sku || !variantDraft.price) return;
      const newVariant = {
        ...variantDraft,
        price: Number(variantDraft.price),
        stock: Number(variantDraft.stock) || 0,
        images: variantDraft.images || [],
      };
      const updatedVariants = Array.isArray(form.variants) ? [...form.variants] : [];
      if (editingVariantIdx !== null) {
        updatedVariants[editingVariantIdx] = newVariant;
      } else {
        updatedVariants.push(newVariant);
      }
      setForm({ ...form, variants: updatedVariants });
      setVariantDraft({ sku: '', attributes: {}, price: '', stock: '', images: [] });
      setEditingVariantIdx(null);
    };

    // Edit variant
    const handleEditVariant = (idx: number) => {
      setEditingVariantIdx(idx);
      setVariantDraft(form.variants?.[idx] || { sku: '', attributes: {}, price: '', stock: '', images: [] });
    };

    // Delete variant
    const handleDeleteVariant = (idx: number) => {
      const updated = (form.variants || []).filter((_, i) => i !== idx);
      setForm({ ...form, variants: updated });
      if (editingVariantIdx === idx) {
        setEditingVariantIdx(null);
        setVariantDraft({ sku: '', attributes: {}, price: '', stock: '', images: [] });
      }
    };

  const categoriesList = ['all', 'laptops', 'desktops', 'gaming', 'monitors', 'accessories', 'deals'];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'out-of-stock' | 'new' | 'archived'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [imageInputStatus, setImageInputStatus] = useState('No files chosen');
  const [videoInputStatus, setVideoInputStatus] = useState('No file chosen');

  const handleImageUploadComplete = (results: UploadProgressData[]) => {
    const successful = results.filter((r) => r.status === 'completed' && r.response?.url).map((r) => r.response.url);
    if (successful.length > 0) {
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...successful] }));
      setUploadSuccessMessage(`Uploaded ${successful.length} image(s) successfully.`);
      setUnsavedUploads((prev) => [...prev, ...successful]);
    }
    const failed = results.filter((r) => r.status === 'failed');
    if (failed.length > 0) {
      setUploadError(`Some files failed to upload: ${failed.map((r) => r.fileName).join(', ')}`);
    }
  };

  const handleVideoUploadComplete = (results: UploadProgressData[]) => {
    const successful = results.filter((r) => r.status === 'completed' && r.response?.url).map((r) => r.response.url);
    if (successful.length > 0) {
      setForm((prev) => ({ ...prev, videos: successful }));
      setUploadSuccessMessage('Video uploaded successfully.');
      setUnsavedUploads((prev) => [...prev, ...successful]);
    }
    const failed = results.filter((r) => r.status === 'failed');
    if (failed.length > 0) {
      setUploadError(`Video upload failed: ${failed[0].error || failed[0].fileName}`);
    }
  };

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const checkStorageStatus = async () => {
    try {
      const res = await fetch('/api/storage-status');
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
      }
    } catch (err) {
      console.error('Failed to check storage status:', err);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
      await checkStorageStatus();
    };
    loadProducts();
    const interval = setInterval(checkStorageStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    let value: string | number | boolean | string[] = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target instanceof HTMLSelectElement && target.multiple
      ? Array.from(target.selectedOptions).map((o) => o.value)
      : target.value;

    if (name === 'categories' && Array.isArray(value)) {
      value = value.includes('all') ? ['all'] : value.filter((option) => option !== 'all');
      if (value.length === 0) {
        value = ['all'];
      }
    }

    if (name === 'originalPrice' || name === 'discountPercent' || name === 'gstPercent' || name === 'quantity' || name === 'finalSellingPrice') {
      value = target.value === '' ? 0 : Number(target.value);
    }

    console.log(`Field ${name} changed to:`, value, 'type:', typeof value);
    const newForm = { ...form, [name]: value };

    // Auto-calculate originalPrice if finalSellingPrice is set
    if (name === 'finalSellingPrice' || name === 'discountPercent' || name === 'gstPercent') {
      if (newForm.finalSellingPrice && newForm.finalSellingPrice > 0) {
        const discount = (newForm.discountPercent || 0) / 100;
        const gst = (newForm.gstPercent || 0) / 100;
        const calculatedOriginal = newForm.finalSellingPrice / ((1 - discount) * (1 + gst));
        newForm.originalPrice = Math.round(calculatedOriginal * 100) / 100; // Round to 2 decimals
      }
    }

    setForm(newForm);
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
    
    const normalizedCategories = Array.isArray(form.categories)
      ? form.categories.includes('all')
        ? ['all']
        : form.categories
      : ['all'];

    const formData = {
      ...form,
      quantity: form.quantity !== undefined && form.quantity !== null ? form.quantity : 0,
      categories: normalizedCategories,
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
      // Clear unsaved uploads as they are now associated with product
      setUnsavedUploads([]);
      await fetchProducts();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete product?')) return;
    // Delete product and associated media server-side
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const cleanupUnsaved = async (files?: string[]) => {
    const list = files || unsavedUploads;
    if (!list || list.length === 0) return;
    try {
      await fetch('/api/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: list }),
        credentials: 'include',
        keepalive: true,
      });
    } catch (err) {
      console.warn('Cleanup failed', err);
    } finally {
      setUnsavedUploads([]);
    }
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (unsavedUploads.length > 0) {
        try {
          navigator.sendBeacon('/api/media/cleanup', JSON.stringify({ files: unsavedUploads }));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsavedUploads]);

  const startEdit = (p: Product) => {
    setEditingId(p._id);
    console.log('Loading product for edit:', p);
    const discount = (p.discountPercent || 0) / 100;
    const gst = (p.gstPercent || 0) / 100;
    const calculatedFinalPrice = p.originalPrice * (1 - discount) * (1 + gst);
    setForm({
      ...p,
      categories: (p as any).categories || ['all'],
      finalSellingPrice: Math.round(calculatedFinalPrice * 100) / 100,
      biddingStart: p.biddingStart ? new Date(p.biddingStart).toISOString().slice(0, 16) : '',
      biddingEnd: p.biddingEnd ? new Date(p.biddingEnd).toISOString().slice(0, 16) : '',
    });
  };

  const productMarketCount = products.filter((p) => p.bargainEnabled || p.biddingEnabled).length;
  const bargainProductCount = products.filter((p) => p.bargainEnabled).length;
  const biddingProductCount = products.filter((p) => p.biddingEnabled).length;
  const pendingOffersCount = products.reduce((count, p) => count + (p.bargainOffers?.filter((o) => o.status === 'pending').length || 0), 0);
  const activeBidsCount = products.reduce((count, p) => count + (p.bids?.filter((b) => b.status === 'active').length || 0), 0);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">📦 Product Management</h1>
      
      {/* Storage Status Warning */}
      {storageStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          storageStatus.status === 'critical' 
            ? 'bg-red-50 border-red-300' 
            : storageStatus.status === 'warning'
            ? 'bg-yellow-50 border-yellow-300'
            : 'bg-green-50 border-green-300'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className={`font-bold mb-2 ${
                storageStatus.status === 'critical' 
                  ? 'text-red-900' 
                  : storageStatus.status === 'warning'
                  ? 'text-yellow-900'
                  : 'text-green-900'
              }`}>
                {storageStatus.status === 'critical' && '🚨 CRITICAL: Storage Full!'}
                {storageStatus.status === 'warning' && '⚠️ WARNING: Storage Running Low'}
                {storageStatus.status === 'ok' && '✅ Storage OK'}
              </p>
              <p className={`text-sm mb-3 ${
                storageStatus.status === 'critical' 
                  ? 'text-red-800' 
                  : storageStatus.status === 'warning'
                  ? 'text-yellow-800'
                  : 'text-green-800'
              }`}>
                Using <strong>{storageStatus.storage.usedMB} MB</strong> of {storageStatus.storage.limitMB} MB ({storageStatus.storage.usagePercent.toFixed(1)}%)
              </p>
              {storageStatus.recommendations?.length > 0 && (
                <ul className="text-sm space-y-1 mt-2">
                  {storageStatus.recommendations.map((rec: string, i: number) => (
                    <li key={i} className={storageStatus.status === 'critical' ? 'text-red-800' : 'text-yellow-800'}>• {rec}</li>
                  ))}
                </ul>
              )}
            </div>
            <button 
              onClick={checkStorageStatus}
              className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex-shrink-0"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingId ? '✏️ Edit' : '➕ Add'} Product</h2>
        {error && <p className="text-red-600 mb-4 font-semibold bg-red-50 p-3 rounded border border-red-200">{error}</p>}
        
        {/* Basic Information */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">📋 Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                placeholder="Enter product name"
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status || 'active'}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="active">Active</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="new">New</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              placeholder="Enter product description"
              className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              rows={3}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
            <select
              name="categories"
              multiple
              value={(form.categories as string[]) || ['all']}
              onChange={handleChange}
              className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select one or more categories. Default is All.</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">💰 Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Selling Price *</label>
              <input
                name="finalSellingPrice"
                value={form.finalSellingPrice || ''}
                onChange={handleChange}
                type="number"
                placeholder="Enter final price (e.g., 100)"
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-600 mt-1">Price after discount & GST</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                name="discountPercent"
                value={form.discountPercent || 0}
                onChange={handleChange}
                type="number"
                placeholder="0"
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
              <input
                name="gstPercent"
                value={form.gstPercent || 0}
                onChange={handleChange}
                type="number"
                placeholder="0"
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                name="quantity"
                value={form.quantity !== undefined && form.quantity !== null ? String(form.quantity) : ''}
                onChange={handleChange}
                type="number"
                min="0"
                placeholder="0"
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Original Price</label>
            <input
              name="originalPrice"
              value={form.originalPrice || ''}
              onChange={handleChange}
              type="number"
              placeholder="Auto-calculated"
              className="w-full border-2 border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              readOnly
            />
            <p className="text-xs text-gray-600 mt-1">Automatically calculated from final price, discount & GST</p>
          </div>
        </div>

        {/* Market Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">🏷️ Market Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Market Mode</label>
              <select
                name="marketMode"
                value={form.marketMode || 'none'}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="none">None (Direct Sale)</option>
                <option value="bargain">Bargain (Offers)</option>
                <option value="auction">Auction (Bidding)</option>
              </select>
            </div>
            {form.marketMode === 'auction' && (
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-700 mb-2">Auction Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      name="biddingStart"
                      value={form.biddingStart ? String(form.biddingStart) : ''}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      name="biddingEnd"
                      value={form.biddingEnd ? String(form.biddingEnd) : ''}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          
        {/* Media */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">📸 Media</h3>
          
          {/* Image Upload Section */}
          <div className="mb-4">
            <label className="block font-bold text-gray-900 mb-2 bg-blue-50 p-2 rounded border border-blue-200">📸 Upload Multiple Images</label>
            <p className="text-sm text-gray-800 mb-2">Minimum 1 image required. Restart upload अगर file नहीं दिख रहा हो।</p>
            <DragDropUploader
              endpoint="/api/upload"
              allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp']}
              maxFileSize={5}
              maxTotalFiles={10}
              onUploadComplete={handleImageUploadComplete}
              onError={(message) => setUploadError(message)}
              acceptedFormats="image/jpeg,image/png,image/webp"
              uploadLabel="Drag & drop images here or click to browse"
              supportedTypesText="Supported: JPG, PNG, WEBP • Max 5MB each"
            />
            {uploadError && <p className="text-red-600 mt-1 font-semibold">{uploadError}</p>}
            {uploadSuccessMessage && !uploadError && (
              <p className="text-green-600 mt-1 font-semibold">{uploadSuccessMessage}</p>
            )}
            
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
          <div>
            <label className="block font-bold text-gray-900 mb-2 bg-blue-50 p-2 rounded border border-blue-200">🎥 Upload Video (Max 1 minute, MP4/WebM/MOV/AVI with Audio)</label>
            <p className="text-sm text-gray-800 mb-2">
              Audio जरूर हो और duration 60 सेकंड से कम।
              Local server और deployed site दोनों पर max 100MB supported है।
            </p>
            <DragDropUploader
              endpoint="/api/upload"
              allowedFileTypes={['.mp4', '.webm', '.mov', '.avi']}
              maxFileSize={100}
              maxTotalFiles={2}
              onUploadComplete={handleVideoUploadComplete}
              onError={(message) => setUploadError(message)}
              acceptedFormats="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              uploadLabel="Drag & drop videos here or click to browse"
              supportedTypesText="Supported: MP4, WEBM, MOV, AVI • Max 100MB each"
            />
            {uploadError && <p className="text-red-600 mt-1 font-semibold">{uploadError}</p>}
            {uploadSuccessMessage && !uploadError && (
              <p className="text-green-600 mt-1 font-semibold">{uploadSuccessMessage}</p>
            )}

            {/* Display uploaded video */}
            {(form.videos || []).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">✅ Video uploaded successfully:</p>
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
        <div className="flex gap-4">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md transition"
          >
            {loading ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product')}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setForm({ marketMode: 'none', status: 'active' }); }}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold shadow-md transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div id="bidding-bargain-management" className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Bidding & Bargain Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-red-50">
            <p className="text-sm text-gray-600">Products with market activity</p>
            <p className="text-3xl font-bold text-gray-900">{productMarketCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-yellow-50">
            <p className="text-sm text-gray-600">Bargain-enabled products</p>
            <p className="text-3xl font-bold text-gray-900">{bargainProductCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-blue-50">
            <p className="text-sm text-gray-600">Auction-enabled products</p>
            <p className="text-3xl font-bold text-gray-900">{biddingProductCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 bg-green-50">
            <p className="text-sm text-gray-600">Pending actions</p>
            <p className="text-3xl font-bold text-gray-900">{pendingOffersCount + activeBidsCount}</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          <p>Pending bargain offers: {pendingOffersCount}</p>
          <p>Active auction bids: {activeBidsCount}</p>
        </div>
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
            <th className="px-6 py-4 text-left font-semibold text-white">💰 Final Price</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🏷️ Discount</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🧾 GST</th>
            <th className="px-6 py-4 text-left font-semibold text-white">📦 Quantity</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🏷️ Status</th>
            <th className="px-6 py-4 text-left font-semibold text-white">💬 Market Mode</th>
            <th className="px-6 py-4 text-left font-semibold text-white">⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p, idx) => (
            <tr key={p._id} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-300 hover:bg-blue-50 transition`}>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.name}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">₹{(p.originalPrice * (1 - (p.discountPercent || 0)/100) * (1 + (p.gstPercent || 0)/100)).toFixed(2)}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.discountPercent}%</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.gstPercent ?? 0}%</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{p.quantity}</td>
              <td className="px-6 py-4 text-gray-900 font-medium capitalize">{p.status || 'active'}</td>
              <td className="px-6 py-4 text-gray-900 font-medium capitalize">{p.marketMode || 'none'}</td>
              <td className="px-6 py-4">
                <button onClick={() => startEdit(p)} className="mr-3 text-blue-600 font-semibold hover:text-blue-800">✏️ Edit</button>
                <button onClick={() => remove(p._id)} className="mr-3 text-red-600 font-semibold hover:text-red-800">🗑️ Delete</button>
                <Link href={`/admin/market?productId=${encodeURIComponent(p._id)}`} className="text-green-600 font-semibold hover:text-green-800">🔧 Market</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
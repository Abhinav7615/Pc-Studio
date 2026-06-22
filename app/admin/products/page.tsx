'use client';

import Link from 'next/link';
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
          {/* Product Variants Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">🧩 Product Variants</h3>
            <div className="mb-4 p-4 bg-slate-50 rounded border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-2">
                <input
                  className="border p-2 rounded"
                  placeholder="SKU"
                  value={variantDraft.sku}
                  onChange={e => setVariantDraft((v: any) => ({ ...v, sku: e.target.value }))}
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Color"
                  value={variantDraft.attributes?.color || ''}
                  onChange={e => handleVariantAttributeChange('color', e.target.value)}
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Size"
                  value={variantDraft.attributes?.size || ''}
                  onChange={e => handleVariantAttributeChange('size', e.target.value)}
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Price"
                  type="number"
                  value={variantDraft.price}
                  onChange={e => setVariantDraft((v: any) => ({ ...v, price: e.target.value }))}
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Stock"
                  type="number"
                  value={variantDraft.stock}
                  onChange={e => setVariantDraft((v: any) => ({ ...v, stock: e.target.value }))}
                />
              </div>
              {/* Variant images upload */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Variant Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    setVariantUploadError(null);
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const uploaded: string[] = variantDraft.images ? [...variantDraft.images] : [];
                    for (let i = 0; i < files.length; i++) {
                      const f = files[i];
                      const fd = new FormData();
                      fd.append('file', f);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
                        const data = await res.json();
                        if (res.status === 507) {
                          setVariantUploadError(`❌ Storage Full: ${data.details}`);
                          break;
                        } else if (!res.ok) {
                          setVariantUploadError(`❌ Upload failed: ${data.error}`);
                          break;
                        } else if (data.url) {
                          uploaded.push(data.url);
                        }
                      } catch {
                        setVariantUploadError('Upload failed - network error');
                        break;
                      }
                    }
                    setVariantDraft((v: any) => ({ ...v, images: uploaded }));
                  }}
                  className="border p-2 rounded w-full"
                />
                {variantUploadError && <p className="text-red-600 text-xs mt-1">{variantUploadError}</p>}
                {(variantDraft.images || []).length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {variantDraft.images.map((img: string, idx: number) => (
                      <div key={img + idx} className="relative">
                        <img src={img} alt={`variant-img-${idx}`} width={48} height={48} className="w-12 h-12 object-cover rounded border-2 border-blue-500" />
                        <button
                          onClick={() => setVariantDraft((v: any) => ({ ...v, images: v.images.filter((_: string, i: number) => i !== idx) }))}
                          className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveVariant}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingVariantIdx !== null ? 'Update Variant' : 'Add Variant'}
              </button>
              {editingVariantIdx !== null && (
                <button
                  type="button"
                  onClick={() => { setEditingVariantIdx(null); setVariantDraft({ sku: '', attributes: {}, price: '', stock: '', images: [] }); }}
                  className="ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >Cancel</button>
              )}
            </div>
            {/* List of variants */}
            {(form.variants || []).length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">SKU</th>
                      <th className="p-2 border">Color</th>
                      <th className="p-2 border">Size</th>
                      <th className="p-2 border">Price</th>
                      <th className="p-2 border">Stock</th>
                      <th className="p-2 border">Images</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.variants || []).map((v: any, idx: number) => (
                      <tr key={v.sku + idx}>
                        <td className="p-2 border">{v.sku}</td>
                        <td className="p-2 border">{v.attributes?.color || ''}</td>
                        <td className="p-2 border">{v.attributes?.size || ''}</td>
                        <td className="p-2 border">{v.price}</td>
                        <td className="p-2 border">{v.stock}</td>
                        <td className="p-2 border">
                          {(v.images || []).map((img: string, i: number) => (
                            <img key={img + i} src={img} alt="var-img" width={32} height={32} className="inline-block mr-1 rounded border" />
                          ))}
                        </td>
                        <td className="p-2 border">
                          <button onClick={() => handleEditVariant(idx)} className="text-blue-600 hover:underline mr-2">Edit</button>
                          <button onClick={() => handleDeleteVariant(idx)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
  const categoriesList = ['all', 'laptops', 'desktops', 'gaming', 'monitors', 'accessories', 'deals'];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'out-of-stock' | 'new' | 'archived'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
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
      await checkStorageStatus();
    };
    loadProducts();
    const interval = setInterval(checkStorageStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
                    if (res.status === 507) {
                      setUploadError(`❌ Storage Full: ${data.details} Run cleanup or upgrade cluster tier.`);
                      break;
                    } else if (!res.ok) {
                      setUploadError(`❌ Upload failed: ${data.error || 'Unknown error'} (Status: ${res.status})`);
                      break;
                    } else if (data.url) {
                      uploaded.push(data.url);
                    } else {
                      setUploadError(data.error || 'Image upload failed');
                    }
                  } catch (_err) {
                    setUploadError('Image upload failed - network error');
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
          <div>
            <label className="block font-bold text-gray-900 mb-2 bg-blue-50 p-2 rounded border border-blue-200">🎥 Upload Video (Max 1 minute, MP4/WebM/MOV/AVI with Audio)</label>
            <p className="text-sm text-gray-800 mb-2">
              Audio जरूर हो और duration 60 सेकंड से कम।
              Local server और deployed site दोनों पर max 100MB supported है।
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
                if (!file.type.startsWith('video/')) {
                  setUploadError('❌ Please select a valid video file');
                  return;
                }

                const maxSize = 100 * 1024 * 1024;
                if (file.size > maxSize) {
                  setUploadError('❌ Video file too large. Max 100MB allowed');
                  return;
                }

                const video = document.createElement('video');
                video.preload = 'metadata';
                const objectUrl = URL.createObjectURL(file);
                video.src = objectUrl;

                video.onloadedmetadata = async () => {
                  URL.revokeObjectURL(objectUrl);
                  if (video.duration > 60) {
                    setUploadError('❌ Video must be 1 minute or less.');
                    return;
                  }

                  const chunkSize = 1 * 1024 * 1024;
                  const totalChunks = Math.ceil(file.size / chunkSize);
                  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                  const uploadedUrls: string[] = [];

                  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                    const start = chunkIndex * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunkBlob = file.slice(start, end, file.type);
                    const formData = new FormData();
                    formData.append('file', chunkBlob, file.name);
                    formData.append('uploadId', uploadId);
                    formData.append('originalName', file.name);
                    formData.append('chunkIndex', String(chunkIndex));
                    formData.append('totalChunks', String(totalChunks));

                    setVideoInputStatus(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                      credentials: 'include',
                    });

                    const text = await res.text();
                    let data: any;
                    try {
                      data = JSON.parse(text);
                    } catch {
                      throw new Error(text || 'Upload failed');
                    }

                    if (!res.ok) {
                      throw new Error(data.error || 'Video upload failed');
                    }

                    if (data.url) {
                      uploadedUrls.push(data.url);
                    }
                    setVideoInputStatus(`Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
                  }

                  if (uploadedUrls.length > 0) {
                    const url = uploadedUrls[uploadedUrls.length - 1];
                    const uploaded: string[] = form.videos ? [...form.videos] : [];
                    uploaded.push(url);
                    setForm({ ...form, videos: uploaded });
                    setVideoInputStatus(`Uploaded: ${file.name}`);
                  }
                };

                video.onerror = () => {
                  URL.revokeObjectURL(objectUrl);
                  setUploadError('❌ Unable to read video metadata. Please select a valid video file.');
                };
              }}
              className="border p-2 rounded w-full"
            />
            <p className="text-sm text-gray-800 mt-1">{videoInputStatus}</p>
            {uploadError && <p className="text-red-600 mt-1 font-semibold">{uploadError}</p>}

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
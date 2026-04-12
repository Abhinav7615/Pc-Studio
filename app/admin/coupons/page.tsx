'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CouponData {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expirationDays?: number;
  expirationHours?: number;
  startHour?: number;
  endHour?: number;
  usageLimit?: number;
  usedCount?: number;
  type?: 'admin' | 'referral' | 'bargain' | 'bidding';
  user?: { _id: string; name: string; email: string };
  products?: { _id: string; name: string }[];
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
  customerId?: string;
  adminEmail?: string | null;
}

interface ProductOption {
  _id: string;
  name: string;
  originalPrice: number;
}
export default function AdminCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'referral' | 'bargain' | 'bidding'>('all');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expirationDays: '',
    expirationHours: '',
    startHour: '',
    endHour: '',
    usageLimit: '',
    assignedUserId: '',
  });
  const [unlimitedDays, setUnlimitedDays] = useState(false);
  const [unlimitedUsage, setUnlimitedUsage] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const usersData = await res.json();
        setUsers((usersData as UserOption[]).filter(u => !u.adminEmail));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const productsData = await res.json();
        setProducts(productsData as ProductOption[]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const createCoupon = async () => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user: form.assignedUserId || null,
          products: selectedProducts.map(p => p._id),
          discountValue: parseFloat(form.discountValue),
          expirationDays: unlimitedDays ? null : (form.expirationDays ? parseInt(form.expirationDays) : null),
          expirationHours: form.expirationHours ? parseInt(form.expirationHours) : null,
          startHour: form.startHour ? parseInt(form.startHour) : null,
          endHour: form.endHour ? parseInt(form.endHour) : null,
          usageLimit: unlimitedUsage ? null : (form.usageLimit ? parseInt(form.usageLimit) : null),
        }),
      });
      if (res.ok) {
        setForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expirationDays: '',
          expirationHours: '',
          startHour: '',
          endHour: '',
          usageLimit: '',
          assignedUserId: '',
        });
        setUnlimitedDays(false);
        setUnlimitedUsage(false);
        setSelectedProducts([]);
        fetchCoupons();
      } else {
        alert('Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('Failed to create coupon');
    }
  };

  const updateCoupon = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/coupons?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user: form.assignedUserId || null,
          products: selectedProducts.map(p => p._id),
          discountValue: parseFloat(form.discountValue),
          expirationDays: unlimitedDays ? null : (form.expirationDays ? parseInt(form.expirationDays) : null),
          expirationHours: form.expirationHours ? parseInt(form.expirationHours) : null,
          startHour: form.startHour ? parseInt(form.startHour) : null,
          endHour: form.endHour ? parseInt(form.endHour) : null,
          usageLimit: unlimitedUsage ? null : (form.usageLimit ? parseInt(form.usageLimit) : null),
        }),
      });
      if (res.ok) {
        setForm({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          expirationDays: '',
          expirationHours: '',
          startHour: '',
          endHour: '',
          usageLimit: '',
          assignedUserId: '',
        });
        setUnlimitedDays(false);
        setUnlimitedUsage(false);
        setSelectedProducts([]);
        setEditingId(null);
        fetchCoupons();
      } else {
        alert('Failed to update coupon');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('Failed to update coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const blockCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to block this referral coupon?')) return;
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usageLimit: 0 }),
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to block coupon');
      }
    } catch (error) {
      console.error('Error blocking coupon:', error);
      alert('Failed to block coupon');
    }
  };

  const addProduct = (product: ProductOption) => {
    if (!selectedProducts.find(p => p._id === product._id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductSearchTerm('');
    setShowProductDropdown(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product._id.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      expirationDays: '',
      expirationHours: '',
      startHour: '',
      endHour: '',
      usageLimit: '',
      assignedUserId: '',
    });
    setUnlimitedDays(false);
    setUnlimitedUsage(false);
  };

  const startEdit = (coupon: CouponData) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      expirationDays: coupon.expirationDays?.toString() || '',
      expirationHours: coupon.expirationHours?.toString() || '',
      startHour: coupon.startHour?.toString() || '',
      endHour: coupon.endHour?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      assignedUserId: coupon.user?._id || '',
    });
    setSelectedProducts(
      coupon.products?.map((p: any) => ({
        _id: p._id ? p._id.toString() : p.toString(),
        name: p.name || 'Unknown Product',
        originalPrice: 0,
      })) || []
    );
    setUnlimitedDays(!coupon.expirationDays);
    setUnlimitedUsage(!coupon.usageLimit);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchCoupons();
      fetchUsersList();
      fetchProductsList();
    }
  }, [status, session]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading coupons...</div>;
  }

  const filteredCoupons = coupons.filter(coupon => {
    if (filterType === 'admin') return (coupon.type || 'admin') === 'admin';
    if (filterType === 'referral') return coupon.type === 'referral';
    if (filterType === 'bargain') return coupon.type === 'bargain';
    if (filterType === 'bidding') return coupon.type === 'bidding';
    return true;
  });

  const filteredUsers = users.filter((user) => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.customerId?.toLowerCase().includes(q) ?? false)
    );
  });

  const adminCount = coupons.filter(c => (c.type || 'admin') === 'admin').length;
  const referralCount = coupons.filter(c => c.type === 'referral').length;
  const bargainCount = coupons.filter(c => c.type === 'bargain').length;
  const biddingCount = coupons.filter(c => c.type === 'bidding').length;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Coupon Management</h1>
      <p className="text-gray-600 mb-8">Manage coupons and view referral assignments</p>

      <div className="mb-6 flex gap-3 flex-wrap">
        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          All ({coupons.length})
        </button>
        <button onClick={() => setFilterType('admin')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Admin ({adminCount})
        </button>
        <button onClick={() => setFilterType('referral')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'referral' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Referral ({referralCount})
        </button>
        <button onClick={() => setFilterType('bargain')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'bargain' ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Bargain ({bargainCount})
        </button>
        <button onClick={() => setFilterType('bidding')} className={`px-4 py-2 rounded font-semibold transition ${filterType === 'bidding' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
          Bidding ({biddingCount})
        </button>
      </div>

      {filterType === 'bargain' && (
        <div className="mb-8 p-6 bg-amber-50 rounded-lg shadow-sm border border-amber-200">
          <h2 className="text-xl font-semibold mb-2 text-amber-900">Bargain Coupons</h2>
          <p className="text-sm text-amber-800">These coupons are generated automatically when customer bargain offers are accepted. They reflect the exact discount needed to reach the accepted offer price and are reserved for the assigned customer.</p>
        </div>
      )}
      {filterType === 'bidding' && (
        <div className="mb-8 p-6 bg-purple-50 rounded-lg shadow-sm border border-purple-200">
          <h2 className="text-xl font-semibold mb-2 text-purple-900">Bidding Coupons</h2>
          <p className="text-sm text-purple-800">These coupons are generated automatically for winning auction bids. They reflect the exact discount needed to reach the winning bid amount and are reserved for the assigned customer.</p>
        </div>
      )}
      {filterType === 'referral' && (
        <div className="mb-8 p-6 bg-green-50 rounded-lg shadow-sm border border-green-200">
          <h2 className="text-xl font-semibold mb-2 text-green-900">Referral Coupons</h2>
          <p className="text-sm text-green-800">Referral coupons are issued automatically when users earn referral rewards. Use this view to track assigned referral coupons.</p>
        </div>
      )}

      {filterType === 'admin' && (
        <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-md border border-indigo-200">
          <h2 className="text-xl font-bold mb-2 text-indigo-900">{editingId ? '✏️ Edit Coupon' : '➕ Create New Coupon'}</h2>
          <p className="text-sm text-gray-700 mb-4">Add or update admin coupons. सभी फ़ील्ड अच्छे से भरें ताकि कोड सही तरीके से काम करे।</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Code</label>
              <input type="text" placeholder="COUPON10" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200">
                <option value="percentage">% Discount</option>
                <option value="fixed">₹ Fixed</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Value</label>
              <input type="number" placeholder="Value" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Days Valid</label>
              <input type="number" placeholder="Days Valid" value={form.expirationDays} onChange={e => setForm({ ...form, expirationDays: e.target.value })} disabled={unlimitedDays} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-500" />
              <label className="mt-1 flex items-center">
                <input type="checkbox" checked={unlimitedDays} onChange={e => setUnlimitedDays(e.target.checked)} className="mr-2" />
                <span className="text-sm text-gray-700">No Day Limit</span>
              </label>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Assign to Customer (optional)</label>
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search customer by name / email / ID"
                className="mb-2 border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
              />
              <select value={form.assignedUserId} onChange={e => setForm({ ...form, assignedUserId: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200">
                <option value="">Public (All users)</option>
                {filteredUsers.map((user) => (
                  <option key={user._id} value={user._id}>{user.name} — {user.email}{user.customerId ? ` (${user.customerId})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Product Selection Section */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-green-900">🎯 Product-Specific Coupon (Optional)</h3>
            <p className="text-sm text-green-700 mb-4">Select specific products this coupon applies to. Leave empty for all products.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-green-800 mb-2">Search & Add Products</label>
              <div className="relative">
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => {
                    setProductSearchTerm(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Search products by name or ID..."
                  className="w-full border-2 border-green-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <div
                        key={product._id}
                        onClick={() => addProduct(product)}
                        className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">ID: {product._id} | Price: ₹{product.originalPrice}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-green-800 mb-2">Selected Products ({selectedProducts.length})</label>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <div key={product._id} className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-green-900">{product.name}</span>
                      <button
                        onClick={() => removeProduct(product._id)}
                        className="text-red-600 hover:text-red-800 font-bold"
                        title="Remove product"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear all products
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Usage Limit</label>
              <input type="number" placeholder="Usage Limit" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} disabled={unlimitedUsage} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-500" />
              <label className="mt-1 flex items-center">
                <input type="checkbox" checked={unlimitedUsage} onChange={e => setUnlimitedUsage(e.target.checked)} className="mr-2" />
                <span className="text-sm text-gray-700">No Limit</span>
              </label>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">Start Hour (0-23)</label>
              <input type="number" placeholder="Start Hour (0-23)" value={form.startHour} onChange={e => setForm({ ...form, startHour: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-800">End Hour (0-23)</label>
              <input type="number" placeholder="End Hour (0-23)" value={form.endHour} onChange={e => setForm({ ...form, endHour: e.target.value })} className="border-2 border-indigo-300 p-3 rounded bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={editingId ? updateCoupon : createCoupon} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold transition shadow-md">
              {editingId ? 'Update Coupon' : 'Create Coupon'}
            </button>
            {editingId && <button onClick={cancelEdit} className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold transition shadow-md">Cancel</button>}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 border-b-2 border-indigo-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-white">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Discount</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Used / Limit</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Valid Days</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Products</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Assigned To</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={filterType === 'referral' ? 8 : 7} className="px-4 py-8 text-center text-gray-500">No coupons found</td>
              </tr>
            ) : (
              filteredCoupons.map(coupon => (
                <tr key={coupon._id} className="border-b border-gray-200 hover:bg-indigo-50 transition">
                  <td className="px-4 py-3 font-bold text-indigo-600">{coupon.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      coupon.type === 'admin' ? 'bg-blue-100 text-blue-800' :
                      coupon.type === 'referral' ? 'bg-green-100 text-green-800' :
                      coupon.type === 'bargain' ? 'bg-amber-100 text-amber-800' :
                      coupon.type === 'bidding' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {coupon.type === 'admin' ? 'Admin' :
                       coupon.type === 'referral' ? 'Referral' :
                       coupon.type === 'bargain' ? 'Bargain' :
                       coupon.type === 'bidding' ? 'Bidding' :
                       'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.expirationDays || '∞'}</td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.products && coupon.products.length > 0 ? (
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {coupon.products.slice(0, 2).map((product, idx) => (
                            <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              {product.name}
                            </span>
                          ))}
                          {coupon.products.length > 2 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                              +{coupon.products.length - 2} more
                            </span>
                          )}
                        </div>
                        {coupon.products.length === 0 && <span className="text-gray-500">All Products</span>}
                      </div>
                    ) : (
                      <span className="text-gray-500">All Products</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.user ? <div><span className="font-semibold text-gray-900">{coupon.user.name}</span><br/><span className="text-gray-600 text-xs">{coupon.user.email}</span></div> : <span className="text-gray-500">Public</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      {(coupon.type || 'admin') === 'admin' && (
                        <>
                          <button onClick={() => startEdit(coupon)} className="px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 font-semibold transition shadow">Edit</button>
                          <button onClick={() => deleteCoupon(coupon._id)} className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 font-semibold transition shadow">Delete</button>
                        </>
                      )}
                      {coupon.type === 'referral' && (
                        <button onClick={() => blockCoupon(coupon._id)} disabled={coupon.usageLimit === 0} className={`px-3 py-1 text-white text-xs rounded font-semibold transition shadow ${coupon.usageLimit === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                          {coupon.usageLimit === 0 ? 'Blocked' : 'Block'}
                        </button>
                      )}
                      {(coupon.type === 'bargain' || coupon.type === 'bidding') && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded font-semibold">Auto-generated</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
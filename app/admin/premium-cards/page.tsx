'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Category { _id: string; name: string; slug: string; description?: string; status?: string; }
interface CardItem { _id: string; name: string; network: string; balance: string; price: number; description?: string; categoryName?: string; image?: string; featured?: boolean; visibility?: string; soldOut?: boolean; status?: string; }
interface InventoryItem { availableQuantity?: number; soldQuantity?: number; soldOut?: boolean; }
interface Settings { qrImage?: string; upiId?: string; merchantName?: string; accountNumber?: string; ifsc?: string; bankName?: string; walletAddress?: string; paymentInstructions?: string; countdownTimer?: number; minimumAmount?: number; maximumAmount?: number; maintenanceMode?: boolean; enableQr?: boolean; enableUpi?: boolean; enableBankTransfer?: boolean; enableManualUpload?: boolean; }
interface OrderItem { _id: string; orderId: string; userName?: string; userEmail?: string; cardName?: string; categoryName?: string; price?: number; status?: string; utrNumber?: string; transactionId?: string; remark?: string; paymentScreenshot?: string; createdAt?: string; approvedAt?: string; releasedAt?: string; cardDetails?: { cardNumber?: string; expiry?: string; cvv?: string; holderName?: string; name?: string; number?: string }; }
interface CardForm { _id?: string; name: string; network: string; balance: string; price: number; categoryName: string; categoryId?: string; description: string; status: string; availableQuantity: number; image: string; featured: boolean; visibility: string; cardNumber?: string; expiry?: string; cvv?: string; holderName?: string; }

const cardTypes = ['Visa', 'MasterCard', 'Amex', 'RuPay', 'Discover'];
const categoryOptions = ['Normal Cards', 'Premium Cards', 'VIP Cards', 'VIP Elite Cards', 'American Express Cards'];
const orderedCategoryNames = ['Normal Cards', 'Premium Cards', 'VIP Cards', 'VIP Elite Cards', 'American Express Cards'];

const defaultCategoryOptions: Category[] = categoryOptions.map((name) => ({
  _id: name,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  description: '',
  status: 'active',
}));

export default function AdminPremiumCardsPage() {
  const [moduleSettings, setModuleSettings] = useState({ shopSectionEnabled: true, adminSectionEnabled: true, title: 'Premium Virtual Cards', description: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [settings, setSettings] = useState<Settings>({});
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [form, setForm] = useState<CardForm>({ name: '', network: 'Visa', balance: '₹5,000', price: 299, categoryName: 'Normal Cards', categoryId: '', description: '', status: 'active', availableQuantity: 10, image: '', featured: false, visibility: 'public' });
  const [activeTab, setActiveTab] = useState<'cards'|'settings'|'orders'>('cards');
  const [settingsMessage, setSettingsMessage] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  const categorySelectOptions = useMemo(() => categoryOptions, []);

  const loadModuleSettings = async () => {
    try {
      const res = await fetch('/api/premium-cards/module-settings');
      if (res.ok) {
        const data = await res.json();
        setModuleSettings({
          shopSectionEnabled: data.shopSectionEnabled ?? true,
          adminSectionEnabled: data.adminSectionEnabled ?? true,
          title: data.title || 'Premium Virtual Cards',
          description: data.description || '',
        });
      }
    } catch (_err) {
      // ignore
    }
  };

  const loadData = async () => {
    const [catRes, cardRes, settingsRes, ordersRes] = await Promise.all([
      fetch('/api/premium-cards/categories', { cache: 'no-store' }),
      fetch('/api/premium-cards/cards', { cache: 'no-store' }),
      fetch('/api/premium-cards/payment-settings', { cache: 'no-store' }),
      fetch('/api/premium-cards/orders', { cache: 'no-store' }),
    ]);

    if (catRes.ok) {
      const fetchedCategories: Category[] = await catRes.json();
      const merged = orderedCategoryNames.map((name) => {
        const found = fetchedCategories.find((category) => category.name === name);
        return found || defaultCategoryOptions.find((category) => category.name === name)!;
      });
      setCategories(merged);
    } else {
      setCategories(defaultCategoryOptions);
    }
    if (cardRes.ok) {
      const data = await cardRes.json();
      setCards(data);
      setInventory(
        Object.fromEntries(
          data.map((card: CardItem & { availableQuantity?: number; soldOut?: boolean }) => [
            card._id,
            { availableQuantity: card.availableQuantity || 0, soldOut: card.soldOut || false },
          ])
        )
      );
    }
    if (settingsRes.ok) setSettings(await settingsRes.json());
    if (ordersRes.ok) setOrders(await ordersRes.json());
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadModuleSettings(), loadData()]);
    };

    void initialize();
  }, []);

  const saveCard = async () => {
    const method = form._id ? 'PUT' : 'POST';
    const endpoint = form._id ? `/api/premium-cards/cards/${form._id}` : '/api/premium-cards/cards';
    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ name: '', network: 'Visa', balance: '₹5,000', price: 299, categoryName: 'Normal Cards', categoryId: '', description: '', status: 'active', availableQuantity: 10, image: '', featured: false, visibility: 'public' });
      await loadData();
    }
  };

  const deleteCard = async (id: string) => { await fetch(`/api/premium-cards/cards/${id}`, { method: 'DELETE' }); await loadData(); };
  const duplicateCard = async (card: CardItem) => { await fetch('/api/premium-cards/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...card, name: `${card.name} Copy`, availableQuantity: inventory[card._id]?.availableQuantity || 0 }) }); await loadData(); };
  const updateOrderStatus = async (id: string, status: string) => { await fetch(`/api/premium-cards/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await loadData(); };
  const [orderModal, setOrderModal] = useState<{ id: string; order?: any } | null>(null);
  const [adminCardDetails, setAdminCardDetails] = useState<{ cardNumber?: string; expiry?: string; cvv?: string; holderName?: string; name?: string } | null>(null);
  const persistSettings = async (updatedSettings: Settings) => {
    setSavingSettings(true);
    setSettingsMessage('Saving settings...');
    try {
      const res = await fetch('/api/premium-cards/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!res.ok) {
        throw new Error('Save failed');
      }
      setSettings(updatedSettings);
      await loadData();
      setSettingsMessage('Settings saved successfully.');
    } catch (err) {
      console.error('Failed to save settings', err);
      setSettingsMessage('Unable to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
      window.setTimeout(() => setSettingsMessage(''), 2500);
    }
  };
  const saveSettings = async () => await persistSettings(settings);

  if (!moduleSettings.adminSectionEnabled) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Card Management</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">This section is currently hidden</h1>
          <p className="mt-3 text-slate-600">Enable the card management section from the admin dashboard visibility settings to access it.</p>
          <Link href="/admin" className="mt-6 inline-flex rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950">Go to Admin Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Admin Panel</p>
            <h1 className="text-3xl font-bold text-slate-900">Premium Virtual Cards</h1>
          </div>
          <Link href="/premium-cards" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">View Storefront</Link>
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          {['cards','settings','orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'cards' | 'settings' | 'orders')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}
            >
              {tab === 'cards' ? 'Cards' : tab === 'settings' ? 'Payment Settings' : 'Orders'}
            </button>
          ))}
        </div>

        {activeTab === 'cards' ? (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Card Manager</h2>
              <div className="mt-4 space-y-3">
                <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Card Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={form.categoryId || form.categoryName} onChange={(e) => {
                  const selected = categories.find((cat) => cat._id === e.target.value || cat.name === e.target.value);
                  setForm({
                    ...form,
                    categoryName: selected?.name || e.target.value,
                    categoryId: selected?._id || '',
                  });
                }}>
                  <option value="">Select card category</option>
                  {categories.length > 0 ? categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>) : categorySelectOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                  {cardTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Balance (₹)" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Price (INR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Available Quantity" type="number" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: Number(e.target.value) })} />
                <textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.featured || false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Featured</label>
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.visibility === 'public'} onChange={(e) => setForm({ ...form, visibility: e.target.checked ? 'public' : 'private' })} />Visible</label>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={saveCard} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950">Save Card</button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card._id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{card.name}</p>
                      <p className="text-sm text-slate-600">{card.categoryName} · {card.network} · ₹{card.price}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600"><p>Qty {inventory[card._id]?.availableQuantity ?? 0}</p><p>{(card.soldOut || (inventory[card._id]?.availableQuantity || 0) <= 0) ? 'Sold Out' : 'Active'}</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setForm({
                      name: card.name,
                      network: card.network || 'Visa',
                      balance: card.balance || '₹5,000',
                      price: card.price || 0,
                      categoryName: card.categoryName || 'Normal Cards',
                      categoryId: '',
                      description: card.description || '',
                      status: card.status || 'active',
                      availableQuantity: inventory[card._id]?.availableQuantity || 0,
                      image: card.image || '',
                      featured: card.featured || false,
                      visibility: card.visibility || 'public',
                    })} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">Edit</button>
                    <button onClick={() => duplicateCard(card)} className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">Duplicate</button>
                    <button onClick={() => deleteCard(card._id)} className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Payment Settings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="UPI ID" value={settings.upiId || ''} onChange={(e) => setSettings({ ...settings, upiId: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Merchant Name" value={settings.merchantName || ''} onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Account Number" value={settings.accountNumber || ''} onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="IFSC" value={settings.ifsc || ''} onChange={(e) => setSettings({ ...settings, ifsc: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Bank Name" value={settings.bankName || ''} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Wallet Address" value={settings.walletAddress || ''} onChange={(e) => setSettings({ ...settings, walletAddress: e.target.value })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Countdown Timer" type="number" value={settings.countdownTimer || 900} onChange={(e) => setSettings({ ...settings, countdownTimer: Number(e.target.value) })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Minimum Amount" type="number" value={settings.minimumAmount || 100} onChange={(e) => setSettings({ ...settings, minimumAmount: Number(e.target.value) })} />
              <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Maximum Amount" type="number" value={settings.maximumAmount || 50000} onChange={(e) => setSettings({ ...settings, maximumAmount: Number(e.target.value) })} />
              <textarea className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 md:col-span-2" placeholder="Payment Instructions" value={settings.paymentInstructions || ''} onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">QR Code Image</p>
              <p className="mt-2 text-sm text-slate-600">Upload a QR image that customers can scan to pay. The image will be served from the site.</p>
              <div className="mt-3 flex items-center gap-3">
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append('file', f);
                  try {
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await uploadRes.json();
                    if (uploadRes.ok && data?.url) {
                      const updated = { ...settings, qrImage: data.url };
                      setSettings(updated);
                      // Auto-save settings after successful upload
                      await fetch('/api/premium-cards/payment-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                      await loadData();
                    } else {
                      alert(data?.error || 'Upload failed');
                    }
                  } catch (err) {
                    console.error('QR upload failed', err);
                    alert('QR upload failed');
                  }
                }} />
                {settings.qrImage ? (
                  <>
                    <div className="w-28 h-28 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img src={settings.qrImage} alt="QR code" className="w-full h-full object-contain" />
                    </div>
                    <button onClick={async () => {
                      const updated = { ...settings, qrImage: '' };
                      setSettings(updated);
                      await fetch('/api/premium-cards/payment-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                      await loadData();
                    }} className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700">Remove</button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={settings.enableQr || false} onChange={(e) => setSettings({ ...settings, enableQr: e.target.checked })} />Enable QR</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={settings.enableUpi || false} onChange={(e) => setSettings({ ...settings, enableUpi: e.target.checked })} />Enable UPI</label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={settings.enableBankTransfer || false} onChange={(e) => setSettings({ ...settings, enableBankTransfer: e.target.checked })} />Enable Bank Transfer</label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={settings.enableManualUpload || false} onChange={async (e) => {
                  const updated = { ...settings, enableManualUpload: e.target.checked };
                  await persistSettings(updated);
                }} />
                Enable direct screenshot upload (consumer)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={settings.maintenanceMode || false} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} />Maintenance Mode</label>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button onClick={saveSettings} disabled={savingSettings} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">Save Settings</button>
              {settingsMessage ? <span className="text-sm text-slate-600">{settingsMessage}</span> : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.map((order) => <div key={order._id} className="rounded-[24px] border border-white/10 bg-slate-900/80 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-white">{order.orderId}</p>
                  <p className="text-sm text-slate-300">{order.userName || 'Guest'} · {order.userEmail || 'No email'}</p>
                  <p className="text-sm text-slate-300">{order.categoryName || 'Card'} · {order.cardName}</p>
                  <p className="text-sm text-slate-300">₹{order.price}</p>
                  {order.utrNumber ? <p className="text-sm text-slate-400">UTR: {order.utrNumber}</p> : null}
                  {order.transactionId ? <p className="text-sm text-slate-400">Transaction ID: {order.transactionId}</p> : null}
                  {order.remark ? <p className="text-sm text-slate-400">Remark: {order.remark}</p> : null}
                  {order.paymentScreenshot ? (
                    <div className="space-y-1">
                      <p className="text-sm text-amber-200">Payment proof available.</p>
                      <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-300 hover:text-sky-200">View screenshot / Drive link</a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No payment proof uploaded.</p>
                  )}
                </div>
                <div className="space-y-2 text-right text-sm">
                  <p className={`font-semibold ${order.status === 'released' ? 'text-emerald-400' : order.status === 'approved' ? 'text-emerald-300' : order.status === 'rejected' ? 'text-rose-300' : 'text-amber-300'}`}>{(order.status || 'pending').toUpperCase()}</p>
                  <p className="text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date'}</p>
                  {order.approvedAt ? <p className="text-slate-300">Verified: {new Date(order.approvedAt).toLocaleString()}</p> : null}
                  {order.releasedAt ? <p className="text-slate-300">Released: {new Date(order.releasedAt).toLocaleString()}</p> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === 'pending' ? (
                  <>
                    <button onClick={() => updateOrderStatus(order._id, 'approved')} className="rounded-full bg-amber-500/20 px-3 py-2 text-sm text-amber-200">Verify Payment</button>
                    <button onClick={() => updateOrderStatus(order._id, 'rejected')} className="rounded-full bg-rose-500/20 px-3 py-2 text-sm text-rose-200">Reject</button>
                  </>
                ) : order.status === 'approved' ? (
                  <>
                    <button onClick={() => { setOrderModal({ id: order._id, order }); setAdminCardDetails({ name: order.cardName }); }} className="rounded-full bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">Release</button>
                  </>
                ) : null}
              </div>
              {order.cardDetails ? (
                <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-white">
                  <p className="font-semibold">Released Card Details</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div><span className="text-slate-300">Number</span><div className="mt-1 text-white">{order.cardDetails.cardNumber || order.cardDetails.number || '—'}</div></div>
                    <div><span className="text-slate-300">Expiry</span><div className="mt-1 text-white">{order.cardDetails.expiry || '—'}</div></div>
                    <div><span className="text-slate-300">CVV</span><div className="mt-1 text-white">{order.cardDetails.cvv || '—'}</div></div>
                    <div><span className="text-slate-300">Holder</span><div className="mt-1 text-white">{order.cardDetails.holderName || order.cardDetails.name || '—'}</div></div>
                  </div>
                </div>
              ) : null}
            </div>)}
          </div>
        ) : null}
        {orderModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Fill Card Details & Release</h3>
              <p className="text-sm text-slate-600 mt-2">Order: {orderModal.order?.orderId}</p>
              <div className="mt-4 grid gap-3">
                <input className="w-full rounded-xl border border-slate-200 p-3" placeholder="Cardholder Name" value={adminCardDetails?.holderName || adminCardDetails?.name || ''} onChange={(e) => setAdminCardDetails({ ...(adminCardDetails||{}), holderName: e.target.value })} />
                <input className="w-full rounded-xl border border-slate-200 p-3" placeholder="Card Number" value={adminCardDetails?.cardNumber || ''} onChange={(e) => setAdminCardDetails({ ...(adminCardDetails||{}), cardNumber: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-xl border border-slate-200 p-3" placeholder="Expiry (MM/YY)" value={adminCardDetails?.expiry || ''} onChange={(e) => setAdminCardDetails({ ...(adminCardDetails||{}), expiry: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 p-3" placeholder="CVV" value={adminCardDetails?.cvv || ''} onChange={(e) => setAdminCardDetails({ ...(adminCardDetails||{}), cvv: e.target.value })} />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={async () => {
                    // send PUT with cardDetails and status released
                    await fetch(`/api/premium-cards/orders/${orderModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'released', cardDetails: adminCardDetails }) });
                    setOrderModal(null);
                    setAdminCardDetails(null);
                    await loadData();
                  }} className="rounded-full bg-emerald-500 px-4 py-2 text-white">Release</button>
                  <button onClick={() => { setOrderModal(null); setAdminCardDetails(null); }} className="rounded-full bg-slate-200 px-4 py-2">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

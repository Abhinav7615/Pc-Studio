'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

interface Category { _id: string; name: string; slug: string; description?: string; status?: string; image?: string; typeImages?: { network: string; image: string }[]; }
interface CardItem { _id: string; categoryId?: string; name: string; network: string; balance: string; price: number; description?: string; categoryName?: string; image?: string; featured?: boolean; visibility?: string; soldOut?: boolean; status?: string; }
interface InventoryItem { availableQuantity?: number; soldQuantity?: number; soldOut?: boolean; }
interface Settings { qrImage?: string; upiId?: string; merchantName?: string; accountNumber?: string; ifsc?: string; bankName?: string; walletAddress?: string; paymentInstructions?: string; countdownTimer?: number; minimumAmount?: number; maximumAmount?: number; maintenanceMode?: boolean; enableQr?: boolean; enableUpi?: boolean; enableBankTransfer?: boolean; enableManualUpload?: boolean; enableGoogleDrivePicker?: boolean; }
interface OrderItem { _id: string; orderId: string; userName?: string; userEmail?: string; userWhatsApp?: string; cardName?: string; categoryName?: string; price?: number; status?: string; utrNumber?: string; transactionId?: string; remark?: string; paymentScreenshot?: string; createdAt?: string; approvedAt?: string; releasedAt?: string; cardDetails?: { cardNumber?: string; expiry?: string; cvv?: string; holderName?: string; name?: string; number?: string }; }
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

interface ThemeSettings {
  sectionTitle?: string;
  sectionDescription?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  buttonStyle?: string;
  buttonRadius?: string;
  ctaButton?: string;
  soldOutButton?: string;
  availableLabel?: string;
  soldOutLabel?: string;
  yourOrdersLabel?: string;
  quantityLabel?: string;
  typeLabel?: string;
  cardDetailsLabel?: string;
  noOrdersText?: string;
  showCardImage?: boolean;
  showCardDescription?: boolean;
  showQuantity?: boolean;
  showNetworkType?: boolean;
  enableCardHoverEffect?: boolean;
  cardsPerRow?: string;
  // Consumer page colors
  consumerPageBg?: string;
  consumerPageText?: string;
  bannerBg?: string;
  bannerText?: string;
  featuredSectionBg?: string;
  featuredSectionText?: string;
  cardBg?: string;
  cardBorder?: string;
  cardText?: string;
  // Payment modal colors
  modalBg?: string;
  modalBorder?: string;
  modalText?: string;
  inputBg?: string;
  inputBorder?: string;
  inputText?: string;
  buttonBg?: string;
  buttonText?: string;
  // Confirmation page colors
  confirmationBg?: string;
  confirmationBorder?: string;
  successColor?: string;
  warningColor?: string;
  // Payment texts
  securePayment?: string;
  countdownLabel?: string;
  amountLabel?: string;
  qrLabel?: string;
  upiLabel?: string;
  bankLabel?: string;
  proofLabel?: string;
  uploadScreenshot?: string;
  instructions?: string;
  submitButton?: string;
  // Confirmation texts
  successTitle?: string;
  successMessage?: string;
  orderDetails?: string;
  paymentDetails?: string;
  whatHappensNext?: string;
  backButton?: string;
  viewOrdersButton?: string;
}

interface BannerSettings {
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerLabel?: string;
  bannerBgColor1?: string;
  bannerBgColor2?: string;
  bannerAccentColor?: string;
  labelColor?: string;
  textColor?: string;
  subtitleColor?: string;
  buttonText?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonHoverBg?: string;
  borderColor?: string;
  shadowColor?: string;
  showLabel?: boolean;
  showSubtitle?: boolean;
  bannerHeight?: string;
}

export default function AdminPremiumCardsPage() {
  const [moduleSettings, setModuleSettings] = useState({ shopSectionEnabled: true, adminSectionEnabled: true, title: 'Premium Virtual Cards', description: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [settings, setSettings] = useState<Settings>({});
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>({});
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({});
  const [form, setForm] = useState<CardForm>({ name: '', network: 'Visa', balance: '₹5,000', price: 299, categoryName: 'Normal Cards', categoryId: '', description: '', status: 'active', availableQuantity: 10, image: '', featured: false, visibility: 'public' });
  const [activeTab, setActiveTab] = useState<'cards'|'settings'|'orders'|'theme'|'banner'>('cards');
  const [settingsMessage, setSettingsMessage] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string>('');
  const [savingTheme, setSavingTheme] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string>('');
  const [savingBanner, setSavingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState<Category | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [selectedCategoryNetworkForImage, setSelectedCategoryNetworkForImage] = useState(cardTypes[0]);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const [categoryDragActive, setCategoryDragActive] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);
  const categoryFileInputRef = useRef<HTMLInputElement | null>(null);

  const categorySelectOptions = useMemo(() => categoryOptions, []);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const filteredCards = useMemo(() => {
    if (activeCategoryFilter === 'All') return cards;
    return cards.filter((card) => {
      if (card.categoryId && card.categoryId === activeCategoryFilter) return true;
      if (card.categoryName && card.categoryName === activeCategoryFilter) return true;
      return false;
    });
  }, [cards, activeCategoryFilter]);

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
    const [catRes, cardRes, settingsRes, ordersRes, themeRes, bannerRes] = await Promise.all([
      fetch('/api/premium-cards/categories', { cache: 'no-store' }),
      fetch('/api/premium-cards/cards', { cache: 'no-store' }),
      fetch('/api/premium-cards/payment-settings', { cache: 'no-store' }),
      fetch('/api/premium-cards/orders', { cache: 'no-store' }),
      fetch('/api/premium-cards/theme', { cache: 'no-store' }),
      fetch('/api/premium-cards/banner-settings', { cache: 'no-store' }),
    ]);

    if (catRes.ok) {
      const fetchedCategories: Category[] = await catRes.json();
      const merged = orderedCategoryNames.map((name) => {
        const found = fetchedCategories.find((category) => category.name === name);
        return found || defaultCategoryOptions.find((category) => category.name === name)!;
      });
      setCategories(merged);
      if (!selectedCategoryForImage && merged.length > 0) {
        setSelectedCategoryForImage(merged[0]);
      }
    } else {
      setCategories(defaultCategoryOptions);
      if (!selectedCategoryForImage && defaultCategoryOptions.length > 0) {
        setSelectedCategoryForImage(defaultCategoryOptions[0]);
      }
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
    if (themeRes.ok) setTheme(await themeRes.json());
    if (bannerRes.ok) setBannerSettings(await bannerRes.json());
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([loadModuleSettings(), loadData()]);
    };

    void initialize();
  }, []);

  const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

  const saveCategoryImage = async (category: Category, network: string, imageUrl: string) => {
    const isExistingCategory = isObjectId(category._id);
    const existingTypeImages = category.typeImages || [];
    const updatedTypeImages = existingTypeImages.filter((item) => item.network !== network);
    updatedTypeImages.push({ network, image: imageUrl });

    const payload = {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      status: category.status || 'active',
      typeImages: updatedTypeImages,
    };

    const endpoint = isExistingCategory
      ? `/api/premium-cards/categories/${encodeURIComponent(category._id)}`
      : '/api/premium-cards/categories';
    const method = isExistingCategory ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Unable to save category image (${res.status}): ${errorBody}`);
    }

    return await res.json();
  };

  const handleCategoryImageUpload = async (file: File) => {
    if (!selectedCategoryForImage) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      setCategoryImageUploading(true);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await uploadRes.json();
      if (uploadRes.ok && data?.url) {
        const updatedCategory = await saveCategoryImage(selectedCategoryForImage, selectedCategoryNetworkForImage, data.url);
        setSelectedCategoryForImage(updatedCategory);
        await loadData();
      } else {
        alert(data?.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Category image upload failed', err);
      alert('Category image upload failed');
    } finally {
      setCategoryImageUploading(false);
      setCategoryDragActive(false);
    }
  };

  const saveCard = async () => {
    const payload = { ...form } as any;
    delete payload.image;
    const method = form._id ? 'PUT' : 'POST';
    const endpoint = form._id ? `/api/premium-cards/cards/${form._id}` : '/api/premium-cards/cards';
    const res = await fetch(endpoint, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setForm({ name: '', network: 'Visa', balance: '₹5,000', price: 299, categoryName: 'Normal Cards', categoryId: '', description: '', status: 'active', availableQuantity: 10, image: '', featured: false, visibility: 'public' });
      await loadData();
    }
  };

  const deleteCard = async (id: string) => { await fetch(`/api/premium-cards/cards/${id}`, { method: 'DELETE', credentials: 'include' }); await loadData(); };
  const duplicateCard = async (card: CardItem) => { await fetch('/api/premium-cards/cards', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...card, name: `${card.name} Copy`, availableQuantity: inventory[card._id]?.availableQuantity || 0 }) }); await loadData(); };
  const updateOrderStatus = async (id: string, status: string) => { await fetch(`/api/premium-cards/orders/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await loadData(); };

  const updateCardStock = async (cardId: string, newQuantity: number) => {
    setUpdatingStockId(cardId);
    try {
      const res = await fetch(`/api/premium-cards/cards/${cardId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableQuantity: newQuantity, soldOut: false }),
      });
      if (res.ok) {
        setEditingStockId(null);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to update stock', err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const toggleSoldOut = async (card: CardItem, shouldSoldOut: boolean) => {
    setUpdatingStockId(card._id);
    try {
      const res = await fetch(`/api/premium-cards/cards/${card._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soldOut: shouldSoldOut, availableQuantity: shouldSoldOut ? 0 : (inventory[card._id]?.availableQuantity || 1) }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to toggle sold out', err);
    } finally {
      setUpdatingStockId(null);
    }
  };
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

  const saveTheme = async () => {
    setSavingTheme(true);
    setThemeMessage('Saving theme...');
    try {
      const res = await fetch('/api/premium-cards/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      if (!res.ok) {
        throw new Error('Save failed');
      }
      setTheme(await res.json());
      setThemeMessage('Theme saved successfully.');
    } catch (err) {
      console.error('Failed to save theme', err);
      setThemeMessage('Unable to save theme. Please try again.');
    } finally {
      setSavingTheme(false);
      window.setTimeout(() => setThemeMessage(''), 2500);
    }
  };

  const saveBanner = async () => {
    setSavingBanner(true);
    setBannerMessage('Saving banner...');
    try {
      const res = await fetch('/api/premium-cards/banner-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerSettings),
      });
      if (!res.ok) {
        throw new Error('Save failed');
      }
      setBannerSettings(await res.json());
      setBannerMessage('Banner saved successfully.');
    } catch (err) {
      console.error('Failed to save banner', err);
      setBannerMessage('Unable to save banner. Please try again.');
    } finally {
      setSavingBanner(false);
      window.setTimeout(() => setBannerMessage(''), 2500);
    }
  };

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
          {['cards','settings','orders','theme','banner'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'cards' | 'settings' | 'orders' | 'theme' | 'banner')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}
            >
              {tab === 'cards' ? 'Cards' : tab === 'settings' ? 'Payment Settings' : tab === 'orders' ? 'Orders' : tab === 'theme' ? 'Theme & Customization' : 'Banner Settings'}
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
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.featured || false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Featured</label>
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.visibility === 'public'} onChange={(e) => setForm({ ...form, visibility: e.target.checked ? 'public' : 'private' })} />Visible</label>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={saveCard} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950">Save Card</button>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-xl font-semibold text-slate-900">Category Image</h2>
              <p className="mt-2 text-sm text-slate-600">Upload one image for the selected category. It will appear for all cards in that category.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Category</label>
                  <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={selectedCategoryForImage?._id || ''} onChange={(e) => {
                    const selected = categories.find((category) => category._id === e.target.value);
                    if (selected) setSelectedCategoryForImage(selected);
                  }}>
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Card Type</label>
                  <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={selectedCategoryNetworkForImage} onChange={(e) => setSelectedCategoryNetworkForImage(e.target.value)}>
                    {cardTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setCategoryDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setCategoryDragActive(false); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCategoryDragActive(true); }}
                  onDrop={async (e) => {
                    e.preventDefault(); e.stopPropagation();
                    setCategoryDragActive(false);
                    const f = e.dataTransfer?.files?.[0];
                    if (!f) return;
                    await handleCategoryImageUpload(f);
                  }}
                  className={`rounded-xl border-2 border-dashed p-6 text-center bg-white ${categoryDragActive ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}
                >
                  <p className="text-sm text-slate-700">Drag & drop category image here</p>
                  <button type="button" onClick={() => categoryFileInputRef.current?.click()} className="mt-3 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">Choose file</button>
                  {categoryImageUploading ? <p className="mt-2 text-xs text-slate-500">Uploading category image...</p> : null}
                  <input ref={categoryFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    await handleCategoryImageUpload(f);
                  }} />
                </div>

                {selectedCategoryForImage ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Current category image</p>
                    <p className="text-xs text-slate-500">Selected type: {selectedCategoryNetworkForImage}</p>
                    {selectedCategoryForImage.typeImages?.find((item) => item.network === selectedCategoryNetworkForImage)?.image || selectedCategoryForImage.image ? (
                      <img
                        src={selectedCategoryForImage.typeImages?.find((item) => item.network === selectedCategoryNetworkForImage)?.image || selectedCategoryForImage.image}
                        alt="Category"
                        className="mt-3 h-48 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No image uploaded for the selected type yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <label className="block text-sm font-medium text-slate-700">Filter cards by category</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900"
                  value={activeCategoryFilter}
                  onChange={(e) => setActiveCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </div>
              {filteredCards.length === 0 ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-slate-600">No cards found in this category.</p>
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isSoldOut = card.soldOut || (inventory[card._id]?.availableQuantity || 0) <= 0;
                  const isEditing = editingStockId === card._id;
                  return (
                  <div key={card._id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-slate-900">{card.name}</p>
                        <p className="text-sm text-slate-600">{card.categoryName} · {card.network} · ₹{card.price}</p>
                      </div>
                      <div className={`text-right px-3 py-1 rounded-full text-sm font-semibold ${isSoldOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isSoldOut ? 'Sold Out' : 'Active'}
                      </div>
                    </div>

                    {/* Stock Management Section */}
                    <div className="rounded-lg bg-slate-50 p-3 mb-4 border border-slate-200">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-slate-700">Stock:</span>
                        {isEditing ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(Number(e.target.value))}
                              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                              autoFocus
                            />
                            <button
                              onClick={() => updateCardStock(card._id, editingStockValue)}
                              disabled={updatingStockId === card._id}
                              className="rounded-lg bg-emerald-500 text-white px-3 py-1 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-70"
                            >
                              {updatingStockId === card._id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              disabled={updatingStockId === card._id}
                              className="rounded-lg bg-slate-300 text-slate-700 px-3 py-1 text-sm font-semibold hover:bg-slate-400 disabled:opacity-70"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-slate-900">{inventory[card._id]?.availableQuantity ?? 0}</span>
                            <button
                              onClick={() => {
                                setEditingStockId(card._id);
                                setEditingStockValue(inventory[card._id]?.availableQuantity ?? 0);
                              }}
                              className="rounded-lg bg-slate-200 text-slate-700 px-3 py-1 text-sm hover:bg-slate-300"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setForm({
                          _id: String(card._id),
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
                        })}
                        className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => duplicateCard(card)}
                        className="rounded-full bg-blue-100 px-3 py-2 text-sm text-blue-700 hover:bg-blue-200"
                      >
                        Duplicate
                      </button>
                      {isSoldOut ? (
                        <button
                          onClick={() => toggleSoldOut(card, false)}
                          disabled={updatingStockId === card._id}
                          className="rounded-full bg-emerald-100 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-200 disabled:opacity-70 font-semibold"
                        >
                          {updatingStockId === card._id ? 'Updating...' : '✓ Mark Available'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleSoldOut(card, true)}
                          disabled={updatingStockId === card._id}
                          className="rounded-full bg-orange-100 px-3 py-2 text-sm text-orange-700 hover:bg-orange-200 disabled:opacity-70 font-semibold"
                        >
                          {updatingStockId === card._id ? 'Updating...' : '⊘ Mark Sold Out'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteCard(card._id)}
                        className="rounded-full bg-rose-100 px-3 py-2 text-sm text-rose-700 hover:bg-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
              )}
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
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={settings.enableGoogleDrivePicker || false} onChange={async (e) => {
                  const updated = { ...settings, enableGoogleDrivePicker: e.target.checked };
                  await persistSettings(updated);
                }} />
                Enable Google Drive picker (consumer)
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
                  {order.userWhatsApp ? <p className="text-sm text-slate-300">WhatsApp: {order.userWhatsApp}</p> : null}
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

        {activeTab === 'theme' ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Theme & Customization</h2>
            <p className="mt-2 text-sm text-slate-600">Customize the appearance and text of the premium cards section on the storefront.</p>
            
            <div className="mt-6 space-y-6">
              {/* Section Text */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Section Text</h3>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Section Title" value={theme.sectionTitle || ''} onChange={(e) => setTheme({ ...theme, sectionTitle: e.target.value })} />
                  <textarea className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 min-h-20" placeholder="Section Description" value={theme.sectionDescription || ''} onChange={(e) => setTheme({ ...theme, sectionDescription: e.target.value })} />
                </div>
              </div>

              {/* Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-700">Primary Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={theme.primaryColor || '#38bdf8'} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900" value={theme.primaryColor || ''} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700">Secondary Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={theme.secondaryColor || '#fbbf24'} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900" value={theme.secondaryColor || ''} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700">Accent Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={theme.accentColor || '#10b981'} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900" value={theme.accentColor || ''} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700">Background Color</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input type="color" value={theme.backgroundColor || '#050816'} onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900" value={theme.backgroundColor || ''} onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Styling */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Button Styling</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-slate-700">Button Style</label>
                    <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={theme.buttonStyle || 'gradient'} onChange={(e) => setTheme({ ...theme, buttonStyle: e.target.value })}>
                      <option value="gradient">Gradient</option>
                      <option value="solid">Solid</option>
                      <option value="outlined">Outlined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700">Button Radius</label>
                    <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={theme.buttonRadius || 'pill'} onChange={(e) => setTheme({ ...theme, buttonRadius: e.target.value })}>
                      <option value="rounded">Rounded</option>
                      <option value="semi-rounded">Semi-Rounded</option>
                      <option value="pill">Pill</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Button Text */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Button & Label Text</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="CTA Button Text" value={theme.ctaButton || 'Buy Now'} onChange={(e) => setTheme({ ...theme, ctaButton: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Sold Out Button Text" value={theme.soldOutButton || 'Sold Out'} onChange={(e) => setTheme({ ...theme, soldOutButton: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Available Label" value={theme.availableLabel || 'Available'} onChange={(e) => setTheme({ ...theme, availableLabel: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Sold Out Label" value={theme.soldOutLabel || 'Sold Out'} onChange={(e) => setTheme({ ...theme, soldOutLabel: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Your Orders Label" value={theme.yourOrdersLabel || 'Your Card Orders'} onChange={(e) => setTheme({ ...theme, yourOrdersLabel: e.target.value })} />
                  <input className="rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Quantity Label" value={theme.quantityLabel || 'Qty'} onChange={(e) => setTheme({ ...theme, quantityLabel: e.target.value })} />
                </div>
              </div>

              {/* Display Options */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Display Options</h3>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={theme.showCardImage ?? true} onChange={(e) => setTheme({ ...theme, showCardImage: e.target.checked })} />
                    <span className="text-sm text-slate-700">Show Card Image</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={theme.showCardDescription ?? true} onChange={(e) => setTheme({ ...theme, showCardDescription: e.target.checked })} />
                    <span className="text-sm text-slate-700">Show Card Description</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={theme.showQuantity ?? true} onChange={(e) => setTheme({ ...theme, showQuantity: e.target.checked })} />
                    <span className="text-sm text-slate-700">Show Quantity</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={theme.showNetworkType ?? true} onChange={(e) => setTheme({ ...theme, showNetworkType: e.target.checked })} />
                    <span className="text-sm text-slate-700">Show Network Type</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={theme.enableCardHoverEffect ?? true} onChange={(e) => setTheme({ ...theme, enableCardHoverEffect: e.target.checked })} />
                    <span className="text-sm text-slate-700">Enable Card Hover Effect</span>
                  </label>
                </div>
              </div>

              {/* Consumer Page Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Consumer Page Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Page Background</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.consumerPageBg || '#ffffff'} onChange={(e) => setTheme({ ...theme, consumerPageBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.consumerPageBg || ''} onChange={(e) => setTheme({ ...theme, consumerPageBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Page Text</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.consumerPageText || '#1e293b'} onChange={(e) => setTheme({ ...theme, consumerPageText: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.consumerPageText || ''} onChange={(e) => setTheme({ ...theme, consumerPageText: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Card Background</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.cardBg || '#ffffff'} onChange={(e) => setTheme({ ...theme, cardBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.cardBg || ''} onChange={(e) => setTheme({ ...theme, cardBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Card Border</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.cardBorder || '#cbd5e1'} onChange={(e) => setTheme({ ...theme, cardBorder: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.cardBorder || ''} onChange={(e) => setTheme({ ...theme, cardBorder: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Modal Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Payment Modal Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Modal Background</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.modalBg || '#0b1220'} onChange={(e) => setTheme({ ...theme, modalBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.modalBg || ''} onChange={(e) => setTheme({ ...theme, modalBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Input Background</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.inputBg || '#0b1727'} onChange={(e) => setTheme({ ...theme, inputBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.inputBg || ''} onChange={(e) => setTheme({ ...theme, inputBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Button Background</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.buttonBg || '#fbbf24'} onChange={(e) => setTheme({ ...theme, buttonBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.buttonBg || ''} onChange={(e) => setTheme({ ...theme, buttonBg: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Button Text</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.buttonText || '#1e293b'} onChange={(e) => setTheme({ ...theme, buttonText: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.buttonText || ''} onChange={(e) => setTheme({ ...theme, buttonText: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Modal Text */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Payment Modal Text</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="Secure Payment" value={theme.securePayment || 'Secure Payment'} onChange={(e) => setTheme({ ...theme, securePayment: e.target.value })} />
                  <input className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="Amount Label" value={theme.amountLabel || 'Amount to Pay'} onChange={(e) => setTheme({ ...theme, amountLabel: e.target.value })} />
                  <input className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="Submit Button" value={theme.submitButton || 'Submit Payment'} onChange={(e) => setTheme({ ...theme, submitButton: e.target.value })} />
                  <input className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="UPI Label" value={theme.upiLabel || 'UPI ID'} onChange={(e) => setTheme({ ...theme, upiLabel: e.target.value })} />
                </div>
              </div>

              {/* Confirmation Page Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Confirmation Page Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Success Color</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.successColor || '#10b981'} onChange={(e) => setTheme({ ...theme, successColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.successColor || ''} onChange={(e) => setTheme({ ...theme, successColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Warning Color</label>
                    <div className="mt-1 flex gap-2">
                      <input type="color" value={theme.warningColor || '#f59e0b'} onChange={(e) => setTheme({ ...theme, warningColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={theme.warningColor || ''} onChange={(e) => setTheme({ ...theme, warningColor: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Page Text */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Confirmation Page Text</h3>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="Success Title" value={theme.successTitle || 'Your payment request is received successfully'} onChange={(e) => setTheme({ ...theme, successTitle: e.target.value })} />
                  <textarea className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 min-h-12" placeholder="Success Message" value={theme.successMessage || ''} onChange={(e) => setTheme({ ...theme, successMessage: e.target.value })} />
                  <input className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="Back Button" value={theme.backButton || 'Back to cards'} onChange={(e) => setTheme({ ...theme, backButton: e.target.value })} />
                  <input className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900" placeholder="View Orders Button" value={theme.viewOrdersButton || 'View my orders'} onChange={(e) => setTheme({ ...theme, viewOrdersButton: e.target.value })} />
                </div>
              </div>

              {/* Cards Per Row */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="block text-sm font-semibold text-slate-900">Cards Per Row</label>
                <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" value={theme.cardsPerRow || '3'} onChange={(e) => setTheme({ ...theme, cardsPerRow: e.target.value })}>
                  <option value="1">1 Card Per Row</option>
                  <option value="2">2 Cards Per Row</option>
                  <option value="3">3 Cards Per Row (Default)</option>
                  <option value="4">4 Cards Per Row</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button onClick={saveTheme} disabled={savingTheme} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">Save Theme</button>
                {themeMessage ? <span className="text-sm text-slate-600">{themeMessage}</span> : null}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'banner' ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Banner Settings</h2>
            <p className="mt-2 text-sm text-slate-600">Customize the premium cards banner appearance on the homepage.</p>
            
            <div className="mt-6 space-y-6">
              {/* Banner Text */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Banner Text</h3>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Banner Label" value={bannerSettings.bannerLabel || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerLabel: e.target.value })} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Banner Title" value={bannerSettings.bannerTitle || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerTitle: e.target.value })} />
                  <textarea className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 min-h-20" placeholder="Banner Subtitle/Description" value={bannerSettings.bannerSubtitle || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerSubtitle: e.target.value })} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900" placeholder="Button Text" value={bannerSettings.buttonText || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonText: e.target.value })} />
                </div>
              </div>

              {/* Banner Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Banner Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Background Color 1 (Start)</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.bannerBgColor1 || '#0f172a'} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerBgColor1: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.bannerBgColor1 || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerBgColor1: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Background Color 2 (End)</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.bannerBgColor2 || '#1e3a8a'} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerBgColor2: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.bannerBgColor2 || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerBgColor2: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Accent Color</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.bannerAccentColor || '#fbbf24'} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerAccentColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.bannerAccentColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerAccentColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Label Color</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.labelColor || '#fcd34d'} onChange={(e) => setBannerSettings({ ...bannerSettings, labelColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.labelColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, labelColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Text Color</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.textColor || '#ffffff'} onChange={(e) => setBannerSettings({ ...bannerSettings, textColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.textColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, textColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Subtitle Color</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.subtitleColor || '#cbd5e1'} onChange={(e) => setBannerSettings({ ...bannerSettings, subtitleColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.subtitleColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, subtitleColor: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Colors */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Button Colors</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-600">Button Background</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.buttonBgColor || '#fbbf24'} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonBgColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.buttonBgColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonBgColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Button Text Color</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.buttonTextColor || '#1f2937'} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonTextColor: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.buttonTextColor || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonTextColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Button Hover Background</label>
                    <div className="mt-2 flex gap-2">
                      <input type="color" value={bannerSettings.buttonHoverBg || '#f59e0b'} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonHoverBg: e.target.value })} className="h-10 w-20 rounded border border-slate-300" />
                      <input className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 font-mono" value={bannerSettings.buttonHoverBg || ''} onChange={(e) => setBannerSettings({ ...bannerSettings, buttonHoverBg: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900">Display Options</h3>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={bannerSettings.showLabel !== false} onChange={(e) => setBannerSettings({ ...bannerSettings, showLabel: e.target.checked })} className="rounded border-slate-300" />
                    <span className="text-slate-700">Show Banner Label</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={bannerSettings.showSubtitle !== false} onChange={(e) => setBannerSettings({ ...bannerSettings, showSubtitle: e.target.checked })} className="rounded border-slate-300" />
                    <span className="text-slate-700">Show Banner Subtitle</span>
                  </label>
                  <div>
                    <label className="text-sm text-slate-600">Banner Height</label>
                    <select value={bannerSettings.bannerHeight || 'md'} onChange={(e) => setBannerSettings({ ...bannerSettings, bannerHeight: e.target.value })} className="w-full mt-2 rounded-xl border border-slate-200 bg-white p-3 text-slate-900">
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium (Default)</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button onClick={saveBanner} disabled={savingBanner} className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">Save Banner Settings</button>
                {bannerMessage ? <span className="text-sm text-slate-600">{bannerMessage}</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

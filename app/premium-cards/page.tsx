'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import GoogleDrivePickerButton from '@/components/GoogleDrivePickerButton';

interface CardItem { _id: string; name: string; network: string; balance: string; price: number; image?: string; categoryName?: string; availableQuantity?: number; soldOut?: boolean; description?: string; }
interface PaymentSettings { qrImage?: string; upiId?: string; merchantName?: string; accountNumber?: string; ifsc?: string; bankName?: string; paymentInstructions?: string; countdownTimer?: number; minimumAmount?: number; maximumAmount?: number; maintenanceMode?: boolean; enableQr?: boolean; enableUpi?: boolean; enableBankTransfer?: boolean; enableManualUpload?: boolean; }
const categoryOptions = ['All', 'Normal Cards', 'Premium Cards', 'VIP Cards', 'VIP Elite Cards', 'American Express Cards'];
interface OrderForm { cardId: string; cardName: string; categoryName: string; price: number; userId?: string; userName?: string; userEmail?: string; userWhatsApp?: string; paymentScreenshot?: string; utrNumber?: string; transactionId?: string; remark?: string; }
interface CardDetails { cardNumber: string; expiry: string; cvv: string; holderName: string; }
interface CardOrderItem { _id: string; orderId: string; cardId: string; cardName: string; categoryName?: string; price: number; status: string; userEmail?: string; createdAt: string; cardDetails?: CardDetails; }

export default function PremiumCardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>({ cardId: '', cardName: '', categoryName: '', price: 0 });
  const [driveLink, setDriveLink] = useState('');
  const [pickerMessage, setPickerMessage] = useState('');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [message, setMessage] = useState('');
  const [myOrders, setMyOrders] = useState<CardOrderItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const { status } = useSession();

  useEffect(() => {
    const fetchInitialData = async () => {
      const [cardRes, settingsRes] = await Promise.all([
        fetch('/api/premium-cards/cards', { cache: 'no-store' }),
        fetch('/api/premium-cards/payment-settings', { cache: 'no-store' }),
      ]);

      if (cardRes.ok) setCards(await cardRes.json());
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        if (settingsData.countdownTimer) setTimeLeft(settingsData.countdownTimer);
      }
    };

    void fetchInitialData();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setTimeLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  const loadMyOrders = async () => {
    const res = await fetch('/api/premium-cards/orders/me');
    if (res.ok) {
      setMyOrders(await res.json());
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    void (async () => {
      const res = await fetch('/api/premium-cards/orders/me');
      if (res.ok) {
        setMyOrders(await res.json());
      }
    })();
  }, [status]);

  const filteredCards = useMemo(() => cards.filter((card) => {
    const categoryMatch = selectedCategory === 'All' || card.categoryName === selectedCategory;
    const searchMatch = !search || card.name.toLowerCase().includes(search.toLowerCase()) || card.network.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [cards, selectedCategory, search]);


  const categoryStyles: Record<string, { group: string; glow: string; badge: string; shell: string; panel: string; price: string; button: string }> = {
    'Normal Cards': {
      group: 'border-sky-500/40 bg-gradient-to-r from-[#042b37] to-[#041826] text-sky-50 shadow-[0_18px_60px_-20px_rgba(56,189,248,0.22)]',
      glow: 'from-sky-500/25 via-sky-400/10 to-transparent',
      badge: 'border-sky-300/40 text-sky-100 bg-[#07232b]/90',
      shell: 'from-[#042b37] via-[#071d2d] to-[#041826]',
      panel: 'from-[#031f30] via-[#07233a] to-[#071b2b]',
      price: 'text-sky-300',
      button: 'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 text-slate-950 shadow-[0_14px_40px_-6px_rgba(56,189,248,0.24)] hover:shadow-[0_22px_60px_-12px_rgba(56,189,248,0.30)]',
    },
    'Premium Cards': {
      group: 'border-amber-500/40 bg-gradient-to-r from-[#2b1606] to-[#0b0906] text-amber-100 shadow-[0_18px_60px_-20px_rgba(251,191,36,0.22)]',
      glow: 'from-amber-500/25 via-amber-400/10 to-transparent',
      badge: 'border-amber-300/40 text-amber-100 bg-[#2a1708]/90',
      shell: 'from-[#2b1606] via-[#1a1108] to-[#0b0906]',
      panel: 'from-[#221206] via-[#2d1808] to-[#140b06]',
      price: 'text-amber-400',
      button: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-300 text-slate-950 shadow-[0_14px_40px_-6px_rgba(250,180,40,0.28)] hover:shadow-[0_22px_60px_-12px_rgba(250,180,40,0.30)]',
    },
    'VIP Cards': {
      group: 'border-fuchsia-500/36 bg-gradient-to-r from-[#2b0a22] to-[#140916] text-fuchsia-100 shadow-[0_18px_60px_-20px_rgba(216,70,227,0.22)]',
      glow: 'from-fuchsia-500/22 via-fuchsia-400/8 to-transparent',
      badge: 'border-fuchsia-300/36 text-fuchsia-100 bg-[#1f0b18]/90',
      shell: 'from-[#2b0a22] via-[#1a0716] to-[#140916]',
      panel: 'from-[#220a1d] via-[#2f1025] to-[#170914]',
      price: 'text-fuchsia-300',
      button: 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 text-slate-950 shadow-[0_14px_40px_-6px_rgba(232,121,249,0.24)] hover:shadow-[0_22px_60px_-12px_rgba(232,121,249,0.30)]',
    },
    'VIP Elite Cards': {
      group: 'border-violet-500/36 bg-gradient-to-r from-[#1e1026] to-[#0f0b18] text-violet-100 shadow-[0_18px_60px_-20px_rgba(167,139,250,0.22)]',
      glow: 'from-violet-500/22 via-violet-400/8 to-transparent',
      badge: 'border-violet-300/36 text-violet-100 bg-[#191024]/90',
      shell: 'from-[#1e1026] via-[#130b1f] to-[#0f0b18]',
      panel: 'from-[#180d24] via-[#241135] to-[#120b1d]',
      price: 'text-violet-300',
      button: 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 text-slate-950 shadow-[0_14px_40px_-6px_rgba(167,139,250,0.24)] hover:shadow-[0_22px_60px_-12px_rgba(167,139,250,0.30)]',
    },
    'American Express Cards': {
      group: 'border-cyan-500/36 bg-gradient-to-r from-[#06262d] to-[#041b23] text-cyan-100 shadow-[0_18px_60px_-20px_rgba(34,211,238,0.22)]',
      glow: 'from-cyan-500/22 via-cyan-400/8 to-transparent',
      badge: 'border-cyan-300/36 text-cyan-100 bg-[#07202a]/90',
      shell: 'from-[#06262d] via-[#071f28] to-[#041b23]',
      panel: 'from-[#042630] via-[#062f3c] to-[#041b24]',
      price: 'text-cyan-300',
      button: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 text-slate-950 shadow-[0_14px_40px_-6px_rgba(34,211,238,0.24)] hover:shadow-[0_22px_60px_-12px_rgba(34,211,238,0.30)]',
    },
  };

  const cardGroups = useMemo(() => filteredCards.reduce((groups, card) => {
    const group = card.categoryName || 'Normal Cards';
    if (!groups[group]) groups[group] = [];
    groups[group].push(card);
    return groups;
  }, {} as Record<string, CardItem[]>), [filteredCards]);

  const orderedGroupNames = ['Normal Cards', 'Premium Cards', 'VIP Cards', 'VIP Elite Cards', 'American Express Cards'];
  const sortedCardGroups = useMemo(() => {
    const entries = Object.entries(cardGroups);
    return entries.sort(([a], [b]) => {
      const aIndex = orderedGroupNames.indexOf(a);
      const bIndex = orderedGroupNames.indexOf(b);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
      }
      return a.localeCompare(b);
    });
  }, [cardGroups]);

  const openCheckout = async (card: CardItem) => {
    setSelectedCard(card);
    setOrderForm({ cardId: card._id, cardName: card.name, categoryName: card.categoryName || 'Normal Cards', price: card.price });
    setDriveLink('');
    setPickerMessage('');
    setMessage('');
    try {
      const res = await fetch('/api/premium-cards/payment-settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to refresh payment settings', err);
    }
    setIsOpen(true);
  };

  const placeOrder = async () => {
    setSubmitAttempted(true);
    if (!driveLink?.trim()) {
      setMessage('Please paste your Google Drive link before placing the order.');
      return;
    }

    if (!orderForm.userWhatsApp || !orderForm.userWhatsApp.trim()) {
      setMessage('Please provide your WhatsApp number before placing the order.');
      return;
    }

    if (!((orderForm.utrNumber && orderForm.utrNumber.trim()) || (orderForm.transactionId && orderForm.transactionId.trim()))) {
      setMessage('Please provide either a UTR number or a Transaction ID before placing the order.');
      return;
    }

    const res = await fetch('/api/premium-cards/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      ...orderForm,
      paymentScreenshot: driveLink.trim(),
    }) });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Order created successfully. Your order ID is ${data.orderId}. Admin will verify payment before card details are released.`);
      setIsOpen(false);
      setSelectedCard(null);
      if (status === 'authenticated') {
        void loadMyOrders();
      }
    } else {
      setMessage(data.error || 'Unable to place order right now.');
    }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%),radial-gradient(circle_at_bottom_center,rgba(16,185,129,0.06),transparent_60%)]" />
      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-600/80 bg-gradient-to-r from-[#071a28] to-[#0f2430]/80 p-8 shadow-[0_45px_140px_-30px_rgba(2,8,23,0.9)] ring-1 ring-white/8">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.05),transparent_45%),radial-gradient(circle_at_center_right,rgba(16,185,129,0.04),transparent_50%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/16 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100 ring-1 ring-emerald-400/35 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live Cards Available
                </span>
                <a
                  href="#my-orders-section"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-950 shadow-[0_24px_90px_-40px_rgba(56,189,248,0.35)] ring-1 ring-white/20 transition duration-200 hover:scale-[1.02] hover:shadow-[0_24px_100px_-30px_rgba(56,189,248,0.45)] sm:ml-auto"
                >
                  Your Card Orders{myOrders.length > 0 ? ` (${myOrders.length})` : ''}
                </a>
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-white drop-shadow-[0_0_36px_rgba(255,255,255,0.45)]">Premium Virtual Cards</h1>
              <p className="mt-4 text-lg leading-8 text-slate-100 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]">Instant delivery. Real balances. Normal, Premium, VIP & American Express cards available now.</p>
              <div className="rounded-3xl border border-slate-500/70 bg-[#071827]/90 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02),0_20px_35px_-20px_rgba(2,8,23,0.9)]">
                <div className="rounded-3xl bg-[#0b1320]/95 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Featured Cards</p>
                      <p className="mt-1 text-lg font-semibold text-white">Filtered by category and network</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categoryOptions.map((name) => (
                        <button
                          key={name}
                          onClick={() => setSelectedCategory(name)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.02em] transition duration-200 ${selectedCategory === name ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_10px_30px_rgba(250,204,21,0.24)] ring-1 ring-amber-400/35' : 'border-slate-600/80 bg-[#111827]/95 text-slate-200 hover:border-slate-400/80 hover:bg-[#18212f]/95 hover:text-white hover:shadow-[0_10px_30px_rgba(15,23,42,0.35)]'}`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-3xl border border-slate-700/80 bg-[#071827]/80 p-2">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search cards, networks..."
                      className="w-full rounded-3xl border border-slate-500/60 bg-[#071827]/90 px-4 py-3 text-sm text-slate-100 placeholder-slate-300 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-600/80 bg-gradient-to-br from-[#071827] to-[#0b2830]/90 p-6 shadow-[0_24px_70px_-25px_rgba(2,8,23,0.92)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-200">Featured Access</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{cards.length} Cards</p>
                </div>
                <div className="rounded-full border border-amber-400/30 bg-amber-500/12 px-3 py-1 text-sm text-amber-100">Secure Checkout</div>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-600/80 bg-[#072433]/92 p-5 text-sm text-slate-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_18px_40px_-24px_rgba(2,8,23,0.92)]">
                <p className="font-semibold text-white">How it works</p>
                <p className="mt-3 text-slate-200">Select a card, pay with proof, and wait for admin verification. Approved orders reveal real card details securely.</p>
              </div>
            </div>
          </div>
        </div>

        {message ? <div className="mt-8 rounded-2xl border border-amber-400/35 bg-amber-500/14 p-4 text-amber-100 shadow-[0_12px_30px_-20px_rgba(251,191,36,0.4)]">{message}</div> : null}

        {sortedCardGroups.map(([groupName, cards]) => {
          const groupStyle = categoryStyles[groupName]?.group || 'border-slate-500/60 bg-slate-800 text-slate-100';
          return (
            <div key={groupName} className="mt-10">
              <div className={`mb-6 inline-flex items-center rounded-full border border-slate-600/80 bg-[#08111f]/95 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_16px_30px_-15px_rgba(2,8,23,0.95)] ${groupStyle}`}>{groupName}</div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => {
                  const style = categoryStyles[card.categoryName || 'Normal Cards'] || categoryStyles['Normal Cards'];
                  const isSoldOut = card.soldOut || (card.availableQuantity ?? 0) <= 0;
                  const badgeStyle = isSoldOut ? 'bg-rose-500/20 text-rose-200 border-rose-400/25' : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25';
                  return (
                    <article key={card._id} className={`premium-card-shell group relative overflow-hidden rounded-[32px] border border-slate-600/70 bg-gradient-to-br ${style.shell} p-0 shadow-[0_24px_70px_-28px_rgba(2,8,23,0.95)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_120px_-30px_rgba(2,8,23,0.95)]`}>
                      <div className={`premium-card-glow absolute inset-0 pointer-events-none -z-10 opacity-25 blur-2xl bg-gradient-to-br ${style.glow}`} />
                      <div className={`relative overflow-hidden rounded-[32px] border border-slate-600/70 bg-gradient-to-br ${style.panel} p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_14px_30px_-12px_rgba(2,8,23,0.85)]`}>
                        <div className="flex items-center justify-between gap-4">
                          <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.28em] ${style.badge}`}>{card.categoryName || card.network}</span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}>{isSoldOut ? 'Sold Out' : 'Available'}</span>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="text-2xl font-bold text-white">{card.name}</p>
                            <p className="mt-2 text-sm text-slate-200">{card.network} • <span className="font-semibold text-emerald-300">{card.balance}</span></p>
                            <p className={`mt-4 text-3xl font-extrabold ${style.price}`}>₹{card.price}</p>
                          </div>
                          <div className="relative mx-auto h-20 w-32 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#07111f] via-[#0b1727] to-[#08111f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                            {card.image ? <Image src={card.image} alt={card.name} fill className="object-cover opacity-100" /> : <div className="h-full w-full bg-gradient-to-br from-[#07111f] via-[#0b1727] to-[#08111f]" />}
                          </div>
                        </div>
                        <div className="mt-6 rounded-[28px] border border-slate-600/70 bg-[#0b2430]/92 p-4 text-sm text-slate-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-200">Card details</p>
                          <p className="mt-2 text-sm text-slate-100">{card.description || 'Secure premium virtual card access with instant verification.'}</p>
                        </div>
                      </div>
                      <div className="relative border-t border-slate-700/80 bg-[#050816]/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div className="flex items-center justify-between text-sm text-slate-200">
                          <span className="font-medium text-slate-100">Qty: {card.availableQuantity ?? 0}</span>
                          <span className="font-medium text-slate-100">Type: {card.network}</span>
                        </div>
                        <button onClick={() => openCheckout(card)} disabled={isSoldOut} className={`premium-cta-button mt-5 w-full rounded-full px-4 py-3 font-semibold transition duration-200 ${isSoldOut ? 'cursor-not-allowed bg-slate-800/90 text-slate-200 opacity-90' : `${style.button} hover:scale-[1.01]`}`}>{isSoldOut ? 'Sold Out' : 'Buy Now'}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div id="my-orders-section" className="mt-12 rounded-[28px] border border-slate-600/80 bg-[#08111f]/95 p-6 shadow-[0_24px_70px_-25px_rgba(2,8,23,0.95)]">
          <h2 className="text-2xl font-semibold text-white">Your Card Orders</h2>
          <p className="mt-2 text-sm text-slate-200">Approved orders will show the card details once admin verifies payment.</p>
          {myOrders.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-600/80 bg-[#0b1727]/95 p-8 text-center text-sm text-slate-300 shadow-[0_18px_45px_-20px_rgba(2,8,23,0.95)]">
              No orders found yet. Select a card and place an order to see it appear here.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {myOrders.map((order) => (
                <div key={order._id} className="rounded-3xl border border-slate-600/80 bg-[#0b1727]/95 p-5 shadow-[0_18px_45px_-20px_rgba(2,8,23,0.95)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-white">Order {order.orderId}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{order.cardName}</p>
                    </div>
                    <div className="space-y-1 text-right text-sm text-white">
                      <p>Status: <span className={order.status === 'approved' ? 'text-emerald-400' : order.status === 'rejected' ? 'text-rose-400' : 'text-amber-300'}>{order.status}</span></p>
                      <p>Amount: ₹{order.price}</p>
                    </div>
                  </div>
                  {order.cardDetails ? (
                    <div className="mt-5 grid gap-3 rounded-3xl border border-slate-600/80 bg-[#08111f]/95 p-5 text-sm text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                      <p className="font-semibold text-white">Card Details</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-300">You can copy individual fields or copy all.</div>
                        <button type="button" onClick={async () => {
                          const all = `${order.cardDetails?.cardNumber || ''} | ${order.cardDetails?.expiry || ''} | CVV: ${order.cardDetails?.cvv || ''} | ${order.cardDetails?.holderName || ''}`;
                          try { await navigator.clipboard.writeText(all); setCopied(order._id + '_all'); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error('copy failed', e); }
                        }} className="rounded-full bg-sky-600/10 px-3 py-1 text-sm text-sky-300">{copied === order._id + '_all' ? 'Copied' : 'Copy all'}</button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <span className="text-slate-200">Number</span>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-white">{order.cardDetails.cardNumber}</div>
                            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(order.cardDetails?.cardNumber || ''); setCopied(order._id + '_number'); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error(e); } }} className="ml-3 text-sm text-sky-300">{copied === order._id + '_number' ? 'Copied' : 'Copy'}</button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-200">Expiry</span>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-white">{order.cardDetails.expiry}</div>
                            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(order.cardDetails?.expiry || ''); setCopied(order._id + '_expiry'); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error(e); } }} className="ml-3 text-sm text-sky-300">{copied === order._id + '_expiry' ? 'Copied' : 'Copy'}</button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-200">CVV</span>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-white">{order.cardDetails.cvv}</div>
                            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(order.cardDetails?.cvv || ''); setCopied(order._id + '_cvv'); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error(e); } }} className="ml-3 text-sm text-sky-300">{copied === order._id + '_cvv' ? 'Copied' : 'Copy'}</button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-200">Holder</span>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-white">{order.cardDetails.holderName}</div>
                            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(order.cardDetails?.holderName || ''); setCopied(order._id + '_holder'); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error(e); } }} className="ml-3 text-sm text-sky-300">{copied === order._id + '_holder' ? 'Copied' : 'Copy'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-slate-600/80 bg-[#072433]/90 p-4 text-sm text-slate-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">Card details are published after admin approves your payment.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {isOpen && selectedCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-slate-600/80 bg-[#0b1220]/95 p-6 shadow-[0_46px_120px_-28px_rgba(2,8,23,0.98)] max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div className="rounded-3xl bg-white/7 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.25)]">Secure Payment</p>
                <h3 className="text-2xl font-semibold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">Pay for {selectedCard.name}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full border border-slate-700/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/90">Close</button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
              <div className="rounded-[24px] border border-slate-700/80 bg-[#08111f]/95 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between"><p className="text-sm text-slate-200">Countdown</p><span className="rounded-full bg-amber-500/12 px-3 py-1 text-sm text-amber-200">{formatTime(timeLeft)}</span></div>
                <div className="mt-4 rounded-2xl border border-slate-700/80 bg-[#072433]/92 p-4">
                  <p className="text-sm text-slate-200">Amount to Pay</p>
                  <p className="mt-2 text-3xl font-semibold text-white">₹{selectedCard.price}</p>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  {settings?.enableQr ? (
                    <div>
                      <p className="font-semibold text-white">QR Code</p>
                      {settings.qrImage ? (
                        <div className="mt-2 flex items-center gap-4">
                          <button type="button" onClick={() => setIsQrOpen(true)} className="w-36 h-36 rounded-lg overflow-hidden bg-white/5 border border-slate-700/80 p-2">
                            <img src={settings.qrImage} alt="Payment QR" className="w-full h-full object-contain" />
                          </button>
                          <div className="text-sm text-slate-300">Scan this QR to pay directly using your UPI app. Click to enlarge.</div>
                        </div>
                      ) : (
                        <p className="mt-2 text-slate-400">QR upload available via admin settings.</p>
                      )}
                    </div>
                  ) : null}
                  {settings?.enableUpi ? <div><p className="font-semibold text-white">UPI ID</p><p className="mt-1 text-amber-200">{settings.upiId || 'Not configured yet'}</p></div> : null}
                  {settings?.enableBankTransfer ? <div><p className="font-semibold text-white">Bank Transfer</p><p className="mt-1 text-slate-400">{settings.accountNumber || 'Not configured yet'} · {settings.ifsc || ''}</p></div> : null}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-700/80 bg-[#072433]/92 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">Instructions</p>
                  <p className="mt-2">{settings?.paymentInstructions || 'Please make the transfer and submit your payment proof.'}</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-600/80 bg-[#08111f]/95 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_45px_-24px_rgba(2,8,23,0.95)] max-h-[72vh] overflow-y-auto">
                <p className="text-sm text-slate-200">Payment Proof</p>
                <div className="mt-4 rounded-3xl border border-slate-700/80 bg-[#071827]/95 p-4 text-sm text-slate-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  <p className="font-semibold text-white">Google Drive Link</p>
                  <p className="mt-2 text-slate-400">Save your payment screenshot in Google Drive, then paste the shareable link here. Or use the picker to choose the file directly.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input value={driveLink} onChange={(e) => setDriveLink(e.target.value)} className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 h-12 text-sm text-slate-100 outline-none focus:border-sky-400" placeholder="Paste your Google Drive shareable link" />
                    <GoogleDrivePickerButton buttonLabel="Open Google Drive Picker" onFileSelected={(result) => {
                      setDriveLink(result.shareableLink || '');
                      setPickerMessage(result.name ? `Selected: ${result.name}` : 'Drive file selected');
                    }} onError={(error) => {
                      console.error('Drive picker error:', error);
                      setPickerMessage('Unable to open Google Drive picker. Please try again.');
                    }} />
                  </div>
                  {settings?.enableManualUpload ? (
                    <div className="mt-3">
                      <input id="manual-screenshot-upload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;

                        // client-side validation
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (!f.type.startsWith('image/')) {
                          setUploadError('Only image files are allowed');
                          return;
                        }
                        if (f.size > maxSize) {
                          setUploadError('Image too large. Max 5MB allowed');
                          return;
                        }

                        setUploadError(null);
                        setIsUploading(true);
                        setUploadProgress(0);

                        // Use XMLHttpRequest to track progress
                        try {
                          const formData = new FormData();
                          formData.append('file', f);

                          await new Promise<void>((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.open('POST', '/api/upload');
                            xhr.upload.onprogress = (ev) => {
                              if (ev.lengthComputable) {
                                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                              }
                            };
                            xhr.onload = () => {
                              if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                  const data = JSON.parse(xhr.responseText);
                                  if (data?.url) {
                                    setDriveLink(data.url);
                                    setPickerMessage(`Uploaded: ${f.name}`);
                                    const preview = URL.createObjectURL(f);
                                    setLocalPreviewUrl(preview);
                                    resolve();
                                    return;
                                  }
                                  reject(new Error(data?.error || 'Upload failed'));
                                } catch (err) {
                                  reject(err);
                                }
                              } else {
                                reject(new Error(`Upload failed: ${xhr.status}`));
                              }
                            };
                            xhr.onerror = () => reject(new Error('Upload network error'));
                            xhr.send(formData);
                          });
                        } catch (err: any) {
                          console.error('Manual upload failed', err);
                          setUploadError(err?.message || 'Upload failed');
                        } finally {
                          setIsUploading(false);
                          setUploadProgress(null);
                        }
                      }} />
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => document.getElementById('manual-screenshot-upload')?.click()} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Upload screenshot</button>
                        {driveLink ? <a href={driveLink} target="_blank" rel="noreferrer" className="text-sm text-sky-300">View uploaded</a> : null}
                        {pickerMessage ? <span className="text-sm text-amber-200">{pickerMessage}</span> : null}
                      </div>
                      {isUploading && uploadProgress !== null ? (
                        <div className="mt-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="h-2 bg-sky-500" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      ) : null}
                      {localPreviewUrl ? (
                        <div className="mt-3 w-28 h-28 overflow-hidden rounded-lg border border-slate-700">
                          <img src={localPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      {uploadError ? <p className="mt-2 text-sm text-rose-300">{uploadError}</p> : null}
                    </div>
                  ) : null}
                  {pickerMessage ? <p className="mt-3 text-sm text-amber-200">{pickerMessage}</p> : null}
                </div>
                <div className="mt-4 space-y-3">
                  <input value={orderForm.userName || ''} className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="Your name" onChange={(e) => setOrderForm({ ...orderForm, userName: e.target.value })} />
                  <input value={orderForm.userEmail || ''} className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="Email" onChange={(e) => setOrderForm({ ...orderForm, userEmail: e.target.value })} />
                  <input value={orderForm.userWhatsApp || ''} aria-required="true" className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="WhatsApp number (required)" onChange={(e) => setOrderForm({ ...orderForm, userWhatsApp: e.target.value })} />
                  {submitAttempted && (!orderForm.userWhatsApp || !orderForm.userWhatsApp.trim()) ? <p className="text-sm text-rose-300 mt-1">WhatsApp number is required.</p> : null}
                  <input value={orderForm.utrNumber || ''} aria-required="true" className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="UTR Number (required if Transaction ID not provided)" onChange={(e) => setOrderForm({ ...orderForm, utrNumber: e.target.value })} />
                  <input value={orderForm.transactionId || ''} aria-required="true" className="w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="Transaction ID (required if UTR not provided)" onChange={(e) => setOrderForm({ ...orderForm, transactionId: e.target.value })} />
                  {submitAttempted && !( (orderForm.utrNumber && orderForm.utrNumber.trim()) || (orderForm.transactionId && orderForm.transactionId.trim()) ) ? <p className="text-sm text-rose-300 mt-1">Provide either UTR number or Transaction ID.</p> : null}
                  <textarea value={orderForm.remark || ''} className="min-h-24 w-full rounded-xl border border-slate-700/80 bg-[#0b1727] p-3 text-sm text-slate-100" placeholder="Remark" onChange={(e) => setOrderForm({ ...orderForm, remark: e.target.value })} />
                </div>
                <button onClick={placeOrder} disabled={isUploading} className={`mt-5 w-full rounded-full px-4 py-3 font-semibold text-slate-950 shadow-[0_10px_30px_rgba(250,204,21,0.2)] ${isUploading ? 'bg-slate-700/60 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300'}`}>Submit Payment</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isQrOpen && settings?.qrImage ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsQrOpen(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsQrOpen(false)} className="absolute right-2 top-2 z-50 rounded-full bg-black/60 p-2 text-white">Close</button>
            <div className="flex items-center justify-center w-full h-full p-4">
              <img src={settings.qrImage} alt="Payment QR" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

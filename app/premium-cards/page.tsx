'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface CardItem { _id: string; name: string; network: string; balance: string; price: number; image?: string; categoryName?: string; availableQuantity?: number; soldOut?: boolean; description?: string; }
interface PaymentSettings { qrImage?: string; upiId?: string; merchantName?: string; accountNumber?: string; ifsc?: string; bankName?: string; paymentInstructions?: string; countdownTimer?: number; minimumAmount?: number; maximumAmount?: number; maintenanceMode?: boolean; enableQr?: boolean; enableUpi?: boolean; enableBankTransfer?: boolean; }
const categoryOptions = ['All', 'Normal Cards', 'Premium Cards', 'VIP Cards', 'VIP Elite Cards', 'American Express Cards'];
interface OrderForm { cardId: string; cardName: string; categoryName: string; price: number; userId?: string; userName?: string; userEmail?: string; paymentScreenshot?: string; utrNumber?: string; transactionId?: string; remark?: string; }
interface CardDetails { cardNumber: string; expiry: string; cvv: string; holderName: string; }
interface CardOrderItem { _id: string; orderId: string; cardId: string; cardName: string; categoryName?: string; price: number; status: string; userEmail?: string; createdAt: string; cardDetails?: CardDetails; }

export default function PremiumCardsPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>({ cardId: '', cardName: '', categoryName: '', price: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [message, setMessage] = useState('');
  const [myOrders, setMyOrders] = useState<CardOrderItem[]>([]);
  const { status } = useSession();

  useEffect(() => {
    const fetchInitialData = async () => {
      const [cardRes, settingsRes] = await Promise.all([
        fetch('/api/premium-cards/cards'),
        fetch('/api/premium-cards/payment-settings'),
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

  const categoryStyles: Record<string, { group: string; glow: string; badge: string }> = {
    'Normal Cards': {
      group: 'border-sky-500/20 bg-slate-900 text-sky-300',
      glow: 'from-sky-500/20 via-sky-500/10 to-transparent',
      badge: 'border-sky-300/20 text-sky-300 bg-slate-900/60',
    },
    'Premium Cards': {
      group: 'border-amber-500/20 bg-slate-900 text-amber-300',
      glow: 'from-amber-500/20 via-amber-500/10 to-transparent',
      badge: 'border-amber-300/20 text-amber-300 bg-slate-900/60',
    },
    'VIP Cards': {
      group: 'border-rose-500/20 bg-slate-900 text-rose-300',
      glow: 'from-rose-500/20 via-rose-500/10 to-transparent',
      badge: 'border-rose-300/20 text-rose-300 bg-slate-900/60',
    },
    'VIP Elite Cards': {
      group: 'border-violet-500/20 bg-slate-900 text-violet-300',
      glow: 'from-violet-500/20 via-violet-500/10 to-transparent',
      badge: 'border-violet-300/20 text-violet-300 bg-slate-900/60',
    },
    'American Express Cards': {
      group: 'border-cyan-500/20 bg-slate-900 text-cyan-300',
      glow: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
      badge: 'border-cyan-300/20 text-cyan-300 bg-slate-900/60',
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

  const openCheckout = (card: CardItem) => {
    setSelectedCard(card);
    setOrderForm({ cardId: card._id, cardName: card.name, categoryName: card.categoryName || 'Normal Cards', price: card.price });
    setIsOpen(true);
  };

  const placeOrder = async () => {
    const res = await fetch('/api/premium-cards/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderForm) });
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_28%)]" />
      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-600/90 bg-slate-800/95 p-8 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.98)] backdrop-blur-sm ring-1 ring-slate-700/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_26%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300 ring-1 ring-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live Cards Available
              </span>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-white">Premium Virtual Cards</h1>
              <p className="mt-4 text-lg leading-8 text-slate-100">Instant delivery. Real balances. Normal, Premium, VIP & American Express cards available now.</p>
              <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {categoryOptions.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedCategory(name)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.02em] transition duration-200 ${selectedCategory === name ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/25' : 'bg-slate-800/95 text-slate-100 hover:bg-slate-700/90'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="w-full max-w-sm rounded-3xl border border-slate-600/80 bg-slate-950/95 p-2 shadow-inner shadow-slate-950/70">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cards, networks..."
                    className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-200 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/95 p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.85)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-100">Featured Access</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{cards.length} Cards</p>
                </div>
                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm text-amber-100">Secure Checkout</div>
              </div>
              <div className="mt-5 rounded-3xl border border-slate-600/80 bg-slate-900/95 p-5 text-sm text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                <p className="font-semibold text-white">How it works</p>
                <p className="mt-3 text-slate-100">Select a card, pay with proof, and wait for admin verification. Approved orders reveal real card details securely.</p>
              </div>
            </div>
          </div>
        </div>

        {message ? <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">{message}</div> : null}

        {sortedCardGroups.map(([groupName, cards]) => {
          const groupStyle = categoryStyles[groupName]?.group || 'border-slate-500/60 bg-slate-800 text-slate-100';
          return (
            <div key={groupName} className="mt-10">
              <div className={`mb-6 inline-flex items-center rounded-full border border-slate-600/90 bg-slate-900/95 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm shadow-slate-950/30 ${groupStyle}`}>{groupName}</div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => {
                  const style = categoryStyles[card.categoryName || 'Normal Cards'] || categoryStyles['Normal Cards'];
                  const badgeStyle = card.soldOut ? 'bg-rose-500/25 text-rose-200 border-rose-500/25' : 'bg-emerald-500/30 text-emerald-100 border-emerald-500/25';
                  return (
                    <article key={card._id} className="group relative overflow-hidden rounded-[32px] border border-slate-600/90 bg-slate-900/100 shadow-[0_44px_120px_-40px_rgba(15,23,42,0.96)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_44px_130px_-30px_rgba(15,23,42,0.99)]">
                      <div className={`absolute inset-0 opacity-45 blur-2xl bg-gradient-to-br ${style.glow}`} />
                      <div className="relative overflow-hidden rounded-[32px] border border-slate-700/90 bg-slate-900/95 p-6 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                        <div className="flex items-center justify-between gap-4">
                          <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.28em] ${style.badge}`}>{card.categoryName || card.network}</span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}>{card.soldOut ? 'Sold Out' : 'Available'}</span>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="text-2xl font-bold text-white">{card.name}</p>
                            <p className="mt-2 text-sm text-white">{card.network} • {card.balance}</p>
                            <p className="mt-4 text-3xl font-extrabold text-amber-300">₹{card.price}</p>
                          </div>
                          <div className="relative mx-auto h-20 w-32 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-inner shadow-slate-950/50">
                            {card.image ? <Image src={card.image} alt={card.name} fill className="object-cover opacity-100" /> : <div className="h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />}
                          </div>
                        </div>
                        <div className="mt-6 rounded-[28px] border border-slate-600/80 bg-slate-900/95 p-4 text-sm text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-100">Card details</p>
                          <p className="mt-2 text-sm text-white">{card.description || 'Secure premium virtual card access with instant verification.'}</p>
                        </div>
                      </div>
                      <div className="relative p-5 bg-slate-950/95 border-t border-slate-700/80">
                        <div className="flex items-center justify-between text-sm text-slate-100">
                          <span className="font-medium text-white">Qty: {card.availableQuantity ?? 0}</span>
                          <span className="font-medium text-white">Type: {card.network}</span>
                        </div>
                        <button onClick={() => openCheckout(card)} disabled={card.soldOut} className={`mt-5 w-full rounded-full px-4 py-3 font-semibold transition duration-200 ${card.soldOut ? 'bg-slate-800 text-white cursor-not-allowed opacity-90' : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-[1.01] hover:shadow-[0_20px_50px_-20px_rgba(245,158,11,0.6)]'}`}>{card.soldOut ? 'Sold Out' : 'Buy Now'}</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        {myOrders.length > 0 && (
          <div className="mt-12 rounded-[28px] border border-slate-800 bg-slate-950/95 p-6">
            <h2 className="text-2xl font-semibold text-white">Your Card Orders</h2>
            <p className="mt-2 text-sm text-white">Approved orders will show the card details once admin verifies payment.</p>
            <div className="mt-6 space-y-4">
              {myOrders.map((order) => (
                <div key={order._id} className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shadow-lg shadow-slate-950/20">
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
                    <div className="mt-5 grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-sm text-white">
                      <p className="font-semibold text-white">Card Details</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div><span className="text-slate-200">Number</span><div className="mt-1 text-white">{order.cardDetails.cardNumber}</div></div>
                        <div><span className="text-slate-200">Expiry</span><div className="mt-1 text-white">{order.cardDetails.expiry}</div></div>
                        <div><span className="text-slate-200">CVV</span><div className="mt-1 text-white">{order.cardDetails.cvv}</div></div>
                        <div><span className="text-slate-200">Holder</span><div className="mt-1 text-white">{order.cardDetails.holderName}</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-white">Card details are published after admin approves your payment.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {isOpen && selectedCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-slate-700/90 bg-slate-950/95 p-6 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Secure Payment</p>
                <h3 className="text-2xl font-semibold text-white">Pay for {selectedCard.name}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800/90">Close</button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-slate-700/80 bg-slate-950/90 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)]">
                <div className="flex items-center justify-between"><p className="text-sm text-white">Countdown</p><span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-300">{formatTime(timeLeft)}</span></div>
                <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4">
                  <p className="text-sm text-white">Amount to Pay</p>
                  <p className="mt-2 text-3xl font-semibold text-white">₹{selectedCard.price}</p>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {settings?.enableQr ? <div><p className="font-semibold text-white">QR Code</p><p className="mt-2 text-slate-400">{settings.qrImage ? 'QR image configured in admin' : 'QR upload available via admin settings.'}</p></div> : null}
                  {settings?.enableUpi ? <div><p className="font-semibold text-white">UPI ID</p><p className="mt-1 text-amber-300">{settings.upiId || 'Not configured yet'}</p></div> : null}
                  {settings?.enableBankTransfer ? <div><p className="font-semibold text-white">Bank Transfer</p><p className="mt-1 text-slate-400">{settings.accountNumber || 'Not configured yet'} · {settings.ifsc || ''}</p></div> : null}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 text-sm text-white">
                  <p className="font-semibold text-white">Instructions</p>
                  <p className="mt-2">{settings?.paymentInstructions || 'Please make the transfer and submit your payment proof.'}</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-700/80 bg-slate-950/90 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)]">
                <p className="text-sm text-white">Payment Proof</p>
                <div className="mt-4 space-y-3">
                  <input className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100" placeholder="Your name" onChange={(e) => setOrderForm({ ...orderForm, userName: e.target.value })} />
                  <input className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100" placeholder="Email" onChange={(e) => setOrderForm({ ...orderForm, userEmail: e.target.value })} />
                  <input className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100" placeholder="UTR Number" onChange={(e) => setOrderForm({ ...orderForm, utrNumber: e.target.value })} />
                  <input className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100" placeholder="Transaction ID" onChange={(e) => setOrderForm({ ...orderForm, transactionId: e.target.value })} />
                  <textarea className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100" placeholder="Remark" onChange={(e) => setOrderForm({ ...orderForm, remark: e.target.value })} />
                </div>
                <button onClick={placeOrder} className="mt-5 w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-500/25">Submit Payment</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

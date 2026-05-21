'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import NotificationBell from './NotificationBell';
import InstallAppButton from './InstallAppButton';
import { useConsumerChat } from './ConsumerChatContext';

const categories = [
  { label: 'All', icon: '🗂️' },
  { label: 'Laptops', icon: '💻' },
  { label: 'Desktops', icon: '🖥️' },
  { label: 'Gaming', icon: '🎮' },
  { label: 'Monitors', icon: '🖱️' },
  { label: 'Accessories', icon: '🎧' },
  { label: 'Deals', icon: '🔥' },
];

export default function Header() {
  const { items } = useCart();
  const { data: session } = useSession();
  const { consumerChatEnabled, setConsumerChatEnabled, loading: chatModeLoading } = useConsumerChat();
  const [settings, setSettings] = useState({ websiteName: 'Refurbished PC Studio', websiteSubtitle: 'Shop premium refurbished computers', brandLogo: '', darkLogo: '', categoryFilterEnabled: true });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('site-theme');
      const active = stored === 'dark';
      setDarkMode(active);
      document.documentElement.setAttribute('data-theme', active ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/business-settings?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setSettings({
          websiteName: data.websiteName || 'Refurbished PC Studio',
          websiteSubtitle: data.websiteSubtitle || 'Shop premium refurbished computers',
          brandLogo: data.brandLogo || '',
          darkLogo: data.darkLogo || '',
          categoryFilterEnabled: data.categoryFilterEnabled ?? true,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const searchParams = useSearchParams();
  const searchQueryParam = searchParams?.get('search') || '';
  const currentCategory = (searchParams?.get('category') || 'all').toLowerCase();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const displayCount = hasMounted ? itemCount : 0;
  const showSession = hasMounted && !!session;
  const isChatMode = hasMounted && !!session && !chatModeLoading && consumerChatEnabled;
  const homeLink = hasMounted && (session?.user?.role === 'admin' || session?.user?.role === 'staff') ? '/admin' : '/';

  useEffect(() => {
    if (!hasMounted) return;
    setSearchTerm(searchQueryParam);
  }, [searchQueryParam, hasMounted]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setIsMenuOpen(false);
    const category = searchParams?.get('category');
    const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
    router.push(`/?search=${encodeURIComponent(trimmed)}${categoryParam}#products`);
  };

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('site-theme', nextMode ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', nextMode ? 'dark' : 'light');
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 shadow-xl backdrop-blur-xl border-b border-slate-200' : 'bg-transparent'}`} style={{ color: 'var(--text-color)' }}>
      <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation menu"
          >
            <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
          </button>

          <Link href={homeLink} className="flex items-center gap-3">
            {settings.brandLogo || settings.darkLogo ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-lg shadow-slate-200 overflow-hidden">
              <img
                src={darkMode ? settings.darkLogo || settings.brandLogo : settings.brandLogo || settings.darkLogo}
                alt={`${settings.websiteName} Logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-200/30">
              <span className="text-2xl">🛍️</span>
            </div>
          )}
            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate text-base font-semibold" style={{ color: 'var(--primary-color)' }}>
                {settings.websiteName}
              </span>
              <span className="truncate text-xs text-slate-500">{settings.websiteSubtitle}</span>
            </div>
          </Link>
        </div>

        <form onSubmit={submitSearch} className="hidden flex-1 items-center justify-between gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm md:flex md:max-w-2xl">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-lg">🔍</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search refurbished laptops, PCs, accessories..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />
          </div>
          <button type="submit" className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-95">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
            aria-label="Toggle light and dark mode"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>

          {!isChatMode && (
            <Link href="/cart" className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 md:inline-flex">
              <span>🛒</span>
              <span>Cart</span>
              <span className="rounded-full bg-blue-600 px-2 py-1 text-white">{displayCount}</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-2">
            <InstallAppButton />
            {!showSession ? (
              <>
                <Link href="/login" className="rounded-2xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Login
                </Link>
                <Link href="/register" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  {session.user?.name || 'Profile'}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden border-t border-slate-200 bg-white/95 px-4 py-3 shadow-sm md:block md:px-6">
        <div className="container flex items-center justify-between gap-4 overflow-x-auto">
          {settings.categoryFilterEnabled && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {categories.map((category) => {
                const searchQuery = searchParams?.get('search');
                const href = searchQuery
                  ? `/?category=${encodeURIComponent(category.label.toLowerCase())}&search=${encodeURIComponent(searchQuery)}#products`
                  : `/?category=${encodeURIComponent(category.label.toLowerCase())}#products`;
                const isActive = currentCategory === category.label.toLowerCase();
                return (
                  <Link
                    key={category.label}
                    href={href}
                    className={`inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/coupons" className="rounded-3xl bg-sky-50 px-3 py-2 font-semibold text-sky-700 transition hover:bg-sky-100">
              Offers
            </Link>
            <Link href="/support-tickets" className="rounded-3xl bg-slate-50 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100">
              Support
            </Link>
            <Link href="/orders" className="rounded-3xl bg-slate-50 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100">
              Orders
            </Link>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[84px] z-40 border-t border-slate-200 bg-white shadow-xl">
          <div className="space-y-4 p-4">
            <form onSubmit={submitSearch} className="space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products, brands & deals"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
              <button type="submit" className="w-full rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Search
              </button>
            </form>

            <div className="grid gap-3">
              <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                🛒 View Cart ({displayCount})
              </Link>
              <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                📦 My Orders
              </Link>
              <Link href="/coupons" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-slate-900">
                🎫 Coupons & Offers
              </Link>
              <Link href="/support-tickets" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                💬 Support Tickets
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {!showSession ? (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="rounded-3xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">
                    {session.user?.name || 'Profile'}
                  </Link>
                  {!isChatMode && session?.user?.role !== 'admin' && session?.user?.role !== 'staff' && (
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        try {
                          const res = await fetch('/api/user/consumer-chat-mode', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ consumerChatEnabled: true }),
                          });
                          if (res.ok) {
                            setConsumerChatEnabled(true);
                            router.push('/');
                          }
                        } catch (err) {
                          console.error('Unable to enable chat mode:', err);
                        }
                      }}
                      className="w-full rounded-3xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-emerald-700 font-semibold hover:bg-emerald-100"
                    >
                      Enable chat
                    </button>
                  )}
                  {isChatMode ? (
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        try {
                          const res = await fetch('/api/user/consumer-chat-mode', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ consumerChatEnabled: false }),
                          });
                          if (res.ok) {
                            setConsumerChatEnabled(false);
                          }
                        } catch (err) {
                          console.error('Unable to disable chat mode:', err);
                        }
                      }}
                      className="w-full rounded-3xl border border-red-600 bg-red-50 px-4 py-3 text-red-700 font-semibold hover:bg-red-100"
                    >
                      Disable chat
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="w-full rounded-3xl border border-blue-600 bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

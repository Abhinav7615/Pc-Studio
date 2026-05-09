'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';
import { FormEvent, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';
import InstallAppButton from './InstallAppButton';

export default function Header() {
  const { items } = useCart();
  const { data: session } = useSession();
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [websiteName, setWebsiteName] = useState('Refurbished PC Studio');
  const [websiteSubtitle, setWebsiteSubtitle] = useState('Shop premium refurbished computers');
  const [brandLogo, setBrandLogo] = useState('');
  const [darkLogo, setDarkLogo] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMenuOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [pathname]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const displayCount = hasMounted ? itemCount : 0;
  const showSession = hasMounted && !!session;
  const homeLink = hasMounted && (session?.user?.role === 'admin' || session?.user?.role === 'staff') ? '/admin' : '/';

  const submitSearch = (event: FormEvent<HTMLFormElement> | null = null) => {
    if (event) {
      event.preventDefault();
    }
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchOpen(false);
      return;
    }
    setSearchOpen(false);
    router.push(`/?search=${encodeURIComponent(trimmed)}#products`);
  };

  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/business-settings?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setReferralEnabled(data.referralEnabled ?? true);
          setWebsiteName(data.websiteName || 'Refurbished PC Studio');
          setWebsiteSubtitle(data.websiteSubtitle || 'Shop premium refurbished computers');
          setBrandLogo(data.brandLogo || '');
          setDarkLogo(data.darkLogo || '');
          if (data.websiteNameColor) {
            document.documentElement.style.setProperty('--website-name-color', data.websiteNameColor);
          }
          // Apply favicon
          if (data.favicon) {
            let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'icon';
              document.head.appendChild(faviconLink);
            }
            faviconLink.href = data.favicon;
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <header suppressHydrationWarning className="sticky top-0 z-40 shadow bg-white" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--text-color)' }} role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 md:gap-4 md:py-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="rounded-full p-2 hover:bg-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              <span className="text-lg">🔍</span>
            </button>
            <Link
              href={homeLink}
              title="Go to home"
              className="text-xl md:text-2xl leading-none rounded-full p-2 hover:bg-slate-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <span className="text-xl">🏠</span>
            </Link>
            <div className="min-w-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-white shadow bg-white">
                  <img
                    src={brandLogo || darkLogo || '/icon-192.png'}
                    alt={websiteName}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xl md:text-2xl font-bold truncate hidden sm:block" style={{ color: 'var(--primary-color)' }}>
                    {websiteName}
                  </span>
                  <p className="text-xs md:text-sm text-slate-500 truncate hidden sm:block">
                    {websiteSubtitle}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-900 hover:bg-slate-200 transition min-w-[44px] min-h-[44px]"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="text-lg">{isMenuOpen ? '✕' : '☰'}</span>
            </button>

            <nav className="hidden md:flex items-center gap-3 lg:gap-4" role="navigation" aria-label="Main navigation">
              <NotificationBell />
              <Link href="/cart" className="text-gray-900 font-medium hover:text-blue-600 bg-slate-100 px-3 py-1 rounded min-h-[44px] flex items-center" aria-label="View cart">
                🛒 Cart <span className="ml-2 text-sm text-slate-600">{displayCount}</span>
              </Link>
              <Link href="/orders" className="text-gray-900 font-medium hover:text-blue-600 bg-slate-100 px-3 py-1 rounded min-h-[44px] flex items-center" aria-label="View orders">
                📦 Orders
              </Link>
              <Link href="/coupons" className="text-gray-900 font-medium hover:text-blue-600 bg-yellow-100 px-3 py-1 rounded min-h-[44px] flex items-center" aria-label="View available coupons">
                🎫 Coupons
              </Link>
              <div className="min-h-[44px] flex items-center">
                <InstallAppButton />
              </div>
              {showSession && referralEnabled && (
                <Link href="/referral" className="text-gray-900 font-semibold hover:text-blue-600 min-h-[44px] px-2 flex items-center">
                  👥 Invite Friends
                </Link>
              )}
              {showSession ? (
                <>
                  <Link href="/profile" className="text-gray-900 font-semibold hover:text-blue-600 min-h-[44px] px-2 flex items-center">
                    {session.user?.name}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-blue-600 hover:text-blue-800 min-h-[44px] px-2 flex items-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 min-h-[44px] px-2 flex items-center">
                    Login
                  </Link>
                  <Link href="/register" className="text-blue-600 hover:text-blue-800 min-h-[44px] px-2 flex items-center">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[64px] md:top-[72px] z-30 border-t border-gray-200 bg-white shadow-xl">
          <div className="px-3 py-4 md:px-4 space-y-2 md:space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <form onSubmit={submitSearch} className="flex items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products..."
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 min-h-[44px] flex items-center"
                >
                  Search
                </button>
              </form>
            </div>
            <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100 min-h-[44px] flex items-center justify-between">
              <span>🛒 Cart</span>
              <span className="text-slate-500">{displayCount}</span>
            </Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100 min-h-[44px] flex items-center">
              <span>📦 Orders</span>
            </Link>
            <Link href="/coupons" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-yellow-50 px-4 py-3 text-gray-900 font-medium hover:bg-yellow-100 min-h-[44px] flex items-center">
              🎫 Coupons
            </Link>
            <div className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-h-[44px] flex items-center">
              <InstallAppButton />
            </div>
            {showSession && referralEnabled && (
              <Link href="/referral" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100 min-h-[44px] flex items-center">
                👥 Invite Friends
              </Link>
            )}
            {showSession && (session?.user?.role === 'admin' || session?.user?.role === 'staff') ? (
              <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-gray-900 font-semibold hover:bg-blue-100 min-h-[44px] flex items-center">
                ⚙️ Admin Panel
              </Link>
            ) : null}
            {showSession ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-semibold hover:bg-slate-100 min-h-[44px] flex items-center">
                  {session?.user?.name}
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 min-h-[44px] flex items-center justify-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 min-h-[44px] flex items-center justify-center">
                  Login
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 min-h-[44px] flex items-center justify-center">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

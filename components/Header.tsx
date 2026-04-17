'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';
import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { items } = useCart();
  const { data: session } = useSession();
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [websiteName, setWebsiteName] = useState('Refurbished PC Studio');
  const [websiteSubtitle, setWebsiteSubtitle] = useState('Shop premium refurbished computers');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMenuOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [pathname]);

  const [isLoaded, setIsLoaded] = useState(false);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const homeLink = session?.user?.role === 'admin' || session?.user?.role === 'staff' ? '/admin' : '/';

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

  useEffect(() => {
    setIsLoaded(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Avoid hydation mismatch by showing server/initial content until client has mounted
  const displayCount = isLoaded ? itemCount : 0;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/business-settings', {
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          setReferralEnabled(data.referralEnabled ?? true);
          setWebsiteName(data.websiteName || 'Refurbished PC Studio');
          setWebsiteSubtitle(data.websiteSubtitle || 'Shop premium refurbished computers');
          if (data.websiteNameColor) {
            document.documentElement.style.setProperty('--website-name-color', data.websiteNameColor);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <header className="sticky top-0 z-40 shadow bg-white" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--text-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              className="rounded-full p-2 hover:bg-slate-200 transition-colors"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              🔍
            </button>
            <Link
              href={homeLink}
              title="Go to home"
              className="text-2xl leading-none rounded-full p-2 hover:bg-slate-200 transition-colors"
            >
              🏠
            </Link>
            <div className="min-w-0">
              <Link href="/" className="text-2xl font-bold block truncate" style={{ color: 'var(--primary-color)' }}>
                {websiteName}
              </Link>
              <p className="text-sm text-slate-500 truncate">{websiteSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-900 hover:bg-slate-200 transition"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>

            <nav className="hidden md:flex items-center gap-4">
              <NotificationBell />
              <Link href="/cart" className="text-gray-900 font-medium hover:text-blue-600">
                Cart ({displayCount})
              </Link>
              <Link href="/orders" className="text-gray-900 font-medium hover:text-blue-600">
                Orders
              </Link>
              <Link href="/coupons" className="text-gray-900 font-medium hover:text-blue-600 bg-yellow-100 px-3 py-1 rounded">
                🎫 Coupons
              </Link>
              {session && referralEnabled && (
                <Link href="/referral" className="text-gray-900 font-semibold hover:text-blue-600">
                  Invite Friends
                </Link>
              )}
              {session ? (
                <>
                  <Link href="/profile" className="text-gray-900 font-semibold hover:text-blue-600">
                    {session.user?.name}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-blue-600 hover:text-blue-800">
                    Login
                  </Link>
                  <Link href="/register" className="text-blue-600 hover:text-blue-800">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] z-30 border-t border-gray-200 bg-white shadow-xl">
          <div className="px-4 py-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <form onSubmit={submitSearch} className="flex items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products..."
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-700"
                >
                  Search
                </button>
              </form>
            </div>
            <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100">
              Cart ({displayCount})
            </Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100">
              Orders
            </Link>
            <Link href="/coupons" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-yellow-50 px-4 py-3 text-gray-900 font-medium hover:bg-yellow-100">
              🎫 Coupons
            </Link>
            {session && referralEnabled && (
              <Link href="/referral" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-medium hover:bg-slate-100">
                Invite Friends
              </Link>
            )}
            {session ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 font-semibold hover:bg-slate-100">
                  {session.user?.name}
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-blue-600 font-semibold hover:bg-slate-100">
                  Login
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-blue-600 font-semibold hover:bg-slate-100">
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

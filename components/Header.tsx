'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { items } = useCart();
  const { data: session } = useSession();
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [websiteName, setWebsiteName] = useState('Refurbished PC Studio');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const [isLoaded, setIsLoaded] = useState(false);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const homeLink = session?.user?.role === 'admin' || session?.user?.role === 'staff' ? '/admin' : '/';

  useEffect(() => {
    setIsLoaded(true);
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
    <header className="shadow" style={{ backgroundColor: 'var(--header-bg)', color: 'var(--text-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <Link
              href={homeLink}
              title="Go to home"
              className="text-2xl leading-none rounded-full p-2 hover:bg-slate-200 transition-colors"
            >
              🏠
            </Link>
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
              {websiteName}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-900 hover:bg-slate-200 transition"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
            <nav className="hidden md:flex space-x-4 items-center">
              <Link href="/cart" className="text-gray-900 font-medium hover:text-blue-600">
                Cart ({displayCount})
              </Link>
              {session && (
                <>
                  <Link href="/orders" className="text-gray-900 font-medium hover:text-blue-600">
                    My Orders
                  </Link>
                  <Link href="/coupons" className="text-gray-900 font-medium hover:text-blue-600 bg-yellow-100 px-3 py-1 rounded">
                    🎫 Coupons
                  </Link>
                  {referralEnabled && (
                    <Link href="/referral" className="text-gray-900 font-semibold hover:text-blue-600">
                      Invite Friends
                    </Link>
                  )}
                </>
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
                    Customer Login
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
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="block text-gray-900 font-medium hover:text-blue-600">
              Cart ({displayCount})
            </Link>
            {session && (
              <>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="block text-gray-900 font-medium hover:text-blue-600">
                  My Orders
                </Link>
                <Link href="/coupons" onClick={() => setIsMenuOpen(false)} className="block text-gray-900 font-medium hover:text-blue-600 bg-yellow-100 px-3 py-1 rounded">
                  🎫 Coupons
                </Link>
                {referralEnabled && (
                  <Link href="/referral" onClick={() => setIsMenuOpen(false)} className="block text-gray-900 font-semibold hover:text-blue-600">
                    Invite Friends
                  </Link>
                )}
              </>
            )}
            {session ? (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block text-gray-900 font-semibold hover:text-blue-600">
                  {session.user?.name}
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block text-blue-600 hover:text-blue-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-blue-600 hover:text-blue-800">
                  Customer Login
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block text-blue-600 hover:text-blue-800">
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

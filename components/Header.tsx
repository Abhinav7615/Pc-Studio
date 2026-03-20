'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { items } = useCart();
  const { data: session } = useSession();

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Refurbished PC Studio
          </Link>
          <nav className="space-x-4 flex items-center">
            <Link href="/cart" className="text-gray-900 font-medium hover:text-blue-600">
              Cart ({itemCount})
            </Link>
            {session && (
              <>
                <Link href="/orders" className="text-gray-900 font-medium hover:text-blue-600">
                  My Orders
                </Link>
                <Link href="/referral" className="text-gray-900 font-semibold hover:text-blue-600">
                  Invite Friends
                </Link>
              </>
            )}
            {session ? (
              <>
                <span className="text-gray-900 font-semibold">{session.user?.name}</span>
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
            <Link
              href="/admin/login"
              className="hidden"
            >
              Admin Panel
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

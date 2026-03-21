'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expirationDays?: number;
  expirationDate?: string;
  createdAt: string;
}

export default function MyCoupons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    if (status === 'authenticated') {
      fetchCoupons();
    }
  }, [status, session, router]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/user/coupons');
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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getDaysRemaining = (createdAt: string, expirationDays?: number, expirationDate?: string) => {
    const today = new Date();
    let expiry: Date;

    if (expirationDate) {
      expiry = new Date(expirationDate);
    } else if (expirationDays) {
      const created = new Date(createdAt);
      expiry = new Date(created.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    } else {
      return 'Unlimited';
    }

    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : 'Expired';
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Coupons</h1>
          <p className="text-gray-600">View and manage all your discount coupons</p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Home
          </Link>
        </div>

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">You don't have any coupons yet</p>
            <p className="text-gray-500 mb-6">
              Invite friends to earn referral coupons, or check out our current promotions!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/referral"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Invite Friends
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <div className="mb-4">
                    <p className="text-sm font-medium opacity-90">Discount Code</p>
                    <p className="text-2xl font-bold font-mono">{coupon.code}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className={`w-full py-2 rounded font-semibold transition ${
                      copiedCode === coupon.code
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {copiedCode === coupon.code ? '✓ Copied!' : '📋 Copy Code'}
                  </button>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Discount Value</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        coupon.discountType === 'percentage'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires in:</span>
                      <span className={`font-semibold ${
                        getDaysRemaining(coupon.createdAt, coupon.expirationDays, coupon.expirationDate) === 'Expired'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {getDaysRemaining(coupon.createdAt, coupon.expirationDays, coupon.expirationDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">💡 How to Use Coupons</h2>
          <ul className="space-y-2 text-blue-900">
            <li>✓ Copy any coupon code from above</li>
            <li>✓ Add products to cart</li>
            <li>✓ Paste the coupon code at checkout</li>
            <li>✓ Get your discount applied instantly!</li>
          </ul>
        </div>

        {/* Invite Friends CTA */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-green-900 mb-2">🎁 Earn More Coupons</h2>
          <p className="text-green-800 mb-4">Invite your friends and both of you will receive discount coupons!</p>
          <Link
            href="/referral"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            View Referral Program
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
}

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'customer') {
      router.push('/login');
      return;
    }

    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Referral code copied to clipboard!');
  };

  const generateReferralLink = (code: string) => {
    return `${window.location.origin}/register?ref=${code}`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Error loading user data</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Invite Friends & Earn Rewards</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-2xl font-mono font-bold text-center text-blue-600">
              {user.referralCode}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(user.referralCode)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Copy Code
            </button>
            <button
              onClick={() => copyToClipboard(generateReferralLink(user.referralCode))}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold">Share Your Code</h3>
                <p className="text-gray-600">Share your unique referral code or link with friends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold">Friend Registers</h3>
                <p className="text-gray-600">Your friend signs up using your referral code</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold">Friend Makes Purchase</h3>
                <p className="text-gray-600">When your friend places their first order</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-semibold">Both Get Rewards</h3>
                <p className="text-gray-600">You and your friend both receive discount coupons</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Share on Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use my referral code ${user.referralCode} to get discount on your first order. ${generateReferralLink(user.referralCode)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <span>📱</span> WhatsApp
            </button>
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use my referral code ${user.referralCode} to get discount on your first order.`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(generateReferralLink(user.referralCode))}`, '_blank');
              }}
              className="bg-blue-400 text-white py-3 px-4 rounded hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <span>🐦</span> Twitter
            </button>
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use my referral code ${user.referralCode} to get discount on your first order.`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateReferralLink(user.referralCode))}&quote=${encodeURIComponent(text)}`, '_blank');
              }}
              className="bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <span>📘</span> Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
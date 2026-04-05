'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
}

interface Settings {
  referralEnabled?: boolean;
}

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
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
      const [userRes, settingsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/business-settings')
      ]);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  if (settings && settings.referralEnabled === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">🎁 Invite Friends & Earn Rewards</h1>
            <p className="text-lg text-gray-600">This feature is currently unavailable</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
            <p className="text-2xl font-bold text-yellow-900 mb-4">🔒 Referral Program Disabled</p>
            <p className="text-yellow-800 text-lg mb-6">
              The referral program is currently disabled by the administrator. You cannot share your referral code or earn rewards at this time.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🎁 Invite Friends & Earn Rewards</h1>
          <p className="text-lg text-gray-600">Get exclusive discount coupons when your friends join</p>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Unique Invite Code</h2>
          <div className="bg-blue-900 border-2 border-yellow-400 p-6 rounded-lg mb-6">
            <p className="text-sm text-blue-100 mb-3">Share this code with friends:</p>
            <p className="text-5xl font-mono font-bold text-center text-yellow-300 tracking-wider">
              {user.referralCode}
            </p>
            <p className="text-xs text-blue-100 mt-3 text-center">
              Format: First 4 letters of name + Last 2 digits of mobile
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(user.referralCode)}
              className="bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <span>📋</span> Copy Code
            </button>
            <button
              onClick={() => copyToClipboard(generateReferralLink(user.referralCode))}
              className="bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2"
            >
              <span>🔗</span> Copy Link
            </button>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 border-2 border-green-400 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-green-900 mb-3">✨ You Earn</h3>
            <p className="text-sm text-green-800 mb-4">When someone uses your code:</p>
            <p className="text-3xl font-bold text-green-600">₹100 Coupon</p>
            <p className="text-xs text-green-800 mt-2">Valid for 30 days | Use on any purchase</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-400 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-purple-900 mb-3">🎉 They Earn</h3>
            <p className="text-sm text-purple-800 mb-4">Your friend gets:</p>
            <p className="text-3xl font-bold text-purple-600">₹50 Coupon</p>
            <p className="text-xs text-purple-800 mt-2">Valid for 30 days | First purchase only</p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-bold text-gray-900">Share Your Code</h3>
                <p className="text-gray-700 text-sm">Copy and share your unique referral code or link with friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-bold text-gray-900">Friend Registers</h3>
                <p className="text-gray-700 text-sm">Your friend signs up using your referral code during registration</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-bold text-gray-900">Coupons Created</h3>
                <p className="text-gray-700 text-sm">Both of you instantly receive discount coupons in your accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-bold text-gray-900">Use Your Coupons</h3>
                <p className="text-gray-700 text-sm">Check &quot;🎫 Coupons&quot; in header to view and use your discount codes</p>
              </div>
            </div>
          </div>
        </div>

        {/* View My Coupons CTA */}
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-yellow-900 mb-2">🎫 View Your Coupons</h3>
          <p className="text-yellow-800 mb-4">Check if you have any referral coupons earned from previous invites!</p>
          <Link
            href="/coupons"
            className="inline-block px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 font-bold transition"
          >
            Go to My Coupons →
          </Link>
        </div>

        {/* Share on Social Media Section */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📢 Share on Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use my referral code ${user.referralCode} to get ₹50 discount on your first order. ${generateReferralLink(user.referralCode)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 transition"
            >
              <span>📱</span> WhatsApp
            </button>
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use code ${user.referralCode} for ₹50 off!`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(generateReferralLink(user.referralCode))}`, '_blank');
              }}
              className="bg-blue-400 text-white py-3 px-4 rounded-lg hover:bg-blue-500 font-bold flex items-center justify-center gap-2 transition"
            >
              <span>𝕏</span> Twitter
            </button>
            <button
              onClick={() => {
                const text = `Join me at Refurbished PC Studio! Use referal code ${user.referralCode} for ₹50 discount!`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateReferralLink(user.referralCode))}&quote=${encodeURIComponent(text)}`, '_blank');
              }}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition"
            >
              <span>📘</span> Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ConsumerChatPanel from '@/components/ConsumerChatPanel';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  referralCode?: string;
  customerId?: string;
  role?: string;
  passwordHint?: string;
  consumerChatEnabled?: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', passwordHint: '' });
  const [consumerChatEnabled, setConsumerChatEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to load profile');
          return;
        }

        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          password: '',
          passwordHint: data.passwordHint || '',
        });
        setConsumerChatEnabled(data.consumerChatEnabled || false);
      } catch {
        setError('Failed to fetch profile. Please try again later.');
      }
    };

    fetchProfile();
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.passwordHint.trim()) {
      setError('Name, email, mobile and password hint required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consumerChatEnabled }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
      } else {
        setMessage(data.message || 'Profile updated successfully');
        setProfile(data.user || profile);
        setConsumerChatEnabled(data.user?.consumerChatEnabled ?? consumerChatEnabled);
      }
    } catch {
      setError('Failed to update profile. Please try again.');
    }

    setLoading(false);
  };

  if (status === 'loading' || !profile) {
    return <div className="p-8">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto flex flex-col gap-6 max-w-7xl">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Your profile</h1>
              <p className="mt-2 text-gray-600">Keep your contact information current and manage your customer chat access from one place.</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
              Sign out
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Profile settings</h2>
                <p className="mt-1 text-sm text-gray-600">Update your personal details, email, mobile, and password hint.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Customer ID: <strong>{profile.customerId || 'Unknown'}</strong></span>
            </div>

            <div className="mt-6 space-y-5">
              {error && <div className="rounded-3xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}
              {message && <div className="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200">{message}</div>}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-3xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500' : 'bg-slate-100 cursor-not-allowed'}`}
                    placeholder="Enter your name"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Email
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-3xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500' : 'bg-slate-100 cursor-not-allowed'}`}
                    placeholder="Enter your email"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Mobile
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full rounded-3xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500' : 'bg-slate-100 cursor-not-allowed'}`}
                    placeholder="Enter your mobile"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Password hint
                  <input
                    name="passwordHint"
                    value={form.passwordHint}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a password hint"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={consumerChatEnabled}
                    onChange={(e) => setConsumerChatEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Enable consumer-to-consumer chat</span>
                </label>
                <p className="text-xs text-gray-500 ml-8">When enabled, you can chat directly with other customers. When disabled, only admin support is available.</p>
              </div>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Password (leave blank to keep current)
                <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>

              <div className="flex flex-wrap gap-3">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="min-w-[160px] rounded-3xl bg-indigo-600 px-5 py-3 text-white shadow-sm transition hover:bg-indigo-700">Edit Profile</button>
                ) : (
                  <button onClick={handleSave} disabled={loading} className="min-w-[160px] rounded-3xl bg-blue-600 px-5 py-3 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{loading ? 'Saving...' : 'Save Profile'}</button>
                )}
                {isEditing && (
                  <button onClick={() => {
                    setIsEditing(false);
                    setForm({
                      name: profile.name || '',
                      email: profile.email || '',
                      mobile: profile.mobile || '',
                      password: '',
                      passwordHint: profile.passwordHint || '',
                    });
                    setConsumerChatEnabled(profile.consumerChatEnabled || false);
                    setMessage('');
                    setError('');
                  }} className="min-w-[160px] rounded-3xl border border-gray-300 bg-white px-5 py-3 text-gray-700 transition hover:bg-gray-100">Cancel</button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Customer chat</h2>
                <p className="mt-1 text-sm text-gray-600">Continue your active conversations and manage chat requests in one place.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Referral code: <strong>{profile.referralCode || 'N/A'}</strong></div>
            </div>
            <div className="mt-6">
              <ConsumerChatPanel enabled={consumerChatEnabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

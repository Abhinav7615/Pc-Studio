'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  referralCode?: string;
  customerId?: string;
  role?: string;
  passwordHint?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', passwordHint: '' });
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
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
      } else {
        setMessage(data.message || 'Profile updated successfully');
        setProfile(data.user || profile);
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
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">🧑‍💼 My Profile</h1>

      <div className="max-w-xl bg-white rounded-lg shadow-md p-6 border border-gray-200">
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">{message}</div>}

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border border-gray-300 text-gray-900 placeholder-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100 cursor-not-allowed'}`}
            placeholder="Enter your name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border border-gray-300 text-gray-900 placeholder-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100 cursor-not-allowed'}`}
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">Mobile</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full border border-gray-300 text-gray-900 placeholder-gray-500 px-3 py-2 rounded focus:outline-none focus:ring-2 ${isEditing ? 'bg-white focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100 cursor-not-allowed'}`}
            placeholder="Enter your mobile"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">Password (leave blank to keep current)</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">Password Hint</label>
          <input name="passwordHint" value={form.passwordHint} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="mb-4 text-sm text-gray-600">Customer ID: <strong>{profile.customerId || 'Unknown'}</strong></div>
        <div className="mb-4 text-sm text-gray-600">Referral Code: {profile.referralCode || 'N/A'}</div>

        <div className="flex gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Edit Profile</button>
          ) : (
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Saving...' : 'Save Profile'}</button>
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
                setMessage('');
                setError('');
              }} className="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400">Cancel</button>
          )}
          <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Sign Out</button>
        </div>
      </div>
    </div>
  );
}

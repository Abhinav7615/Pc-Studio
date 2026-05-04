'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface SecretKey {
  _id: string;
  code: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  usedCount: number;
  lastUsedAt?: string;
}

export default function SecretKeysManager() {
  const { data: session, status } = useSession();
  const [secretKeys, setSecretKeys] = useState<SecretKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchSecretKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/secret-keys');
      if (res.ok) {
        const data = await res.json();
        setSecretKeys(data.secretKeys || []);
      } else {
        setError('Failed to fetch secret keys');
      }
    } catch (err) {
      console.error('Failed to fetch secret keys:', err);
      setError('Failed to fetch secret keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/admin/login';
    } else if (session?.user?.role === 'admin') {
      fetchSecretKeys();
    }
  }, [session, status, fetchSecretKeys]);

  const createSecretKey = async () => {
    if (!newDescription.trim()) {
      setError('Description is required');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/secret-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`Secret key created: ${data.secretKey.code}`);
        setNewDescription('');
        fetchSecretKeys();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create secret key');
      }
    } catch (err) {
      setError('Failed to create secret key');
    } finally {
      setCreating(false);
    }
  };

  const deleteSecretKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret key?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/secret-keys?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Secret key deleted successfully');
        fetchSecretKeys();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete secret key');
      }
    } catch (err) {
      setError('Failed to delete secret key');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('Code copied to clipboard!');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Secret Keys Manager</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Create New Secret Key */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Create New Secret Key</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Description (e.g., VIP Customer Support)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && createSecretKey()}
              />
              <button
                onClick={createSecretKey}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this code with users who need direct admin connection. When they enter it in the chatbot, they'll be connected to an admin immediately.
            </p>
          </div>

          {/* Secret Keys List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Active Secret Keys</h2>
            {secretKeys.length === 0 ? (
              <p className="text-gray-500">No secret keys created yet.</p>
            ) : (
              <div className="space-y-4">
                {secretKeys.map((key) => (
                  <div key={key._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {key.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.code)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 mb-2">{key.description}</p>
                        <div className="text-sm text-gray-500">
                          Created: {new Date(key.createdAt).toLocaleString()}
                          {key.usedCount > 0 && (
                            <span className="ml-4">
                              Used: {key.usedCount} times
                              {key.lastUsedAt && ` (last: ${new Date(key.lastUsedAt).toLocaleString()})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSecretKey(key._id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
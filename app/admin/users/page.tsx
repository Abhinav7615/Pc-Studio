'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
  blocked: boolean;
  customerId?: string;
  adminEmail?: string | null;
  importantConsumer?: boolean;
}

export default function AdminUsers() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', passwordHint: '', role: 'staff' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const isAdmin = session?.user?.role === 'admin';
  const isStaff = session?.user?.role === 'staff';

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        setError('Failed to load users');
        return;
      }
      const data = await res.json();
      const filtered = (data as User[]).filter((u) => !u.adminEmail);
      setUsers(filtered);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.mobile.toLowerCase().includes(q) ||
      (u.customerId?.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };
    if (status === 'authenticated' && (isAdmin || isStaff)) {
      loadUsers();
    }
  }, [status, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addUser = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', role: 'staff' });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (userId: string) => {
    setActionStatus('Sending conversation request...');
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adminMessage: 'An admin has started a conversation with you. Please reply here.' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionStatus(data.error || 'Unable to start conversation');
        return;
      }
      if (data.chat?._id) {
        router.push(`/admin/live-chat?chatId=${data.chat._id}`);
      } else {
        setActionStatus('Conversation started, but could not redirect automatically.');
      }
    } catch (err) {
      console.error(err);
      setActionStatus('Failed to start conversation.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Remove user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        alert('Failed to delete user');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !blocked }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        alert('Failed to update user');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        alert('Failed to update user role');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const toggleImportantConsumer = async (id: string, importantConsumer: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importantConsumer: !importantConsumer }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        alert('Failed to update user');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: '',
      passwordHint: '',
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', role: 'staff' });
    setError('');
  };

  const updateUser = async () => {
    if (!editingId) return;
    setLoading(true);
    setError('');
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      role: form.role,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }
    if (form.passwordHint.trim()) {
      payload.passwordHint = form.passwordHint;
    }

    try {
      const res = await fetch(`/api/users/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (res.ok) {
        cancelEdit();
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async () => {
    if (editingId) {
      await updateUser();
      return;
    }
    await addUser();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">👥 User Management</h1>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, mobile or customerId"
          className="w-full md:w-1/3 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
        />
      </div>

      {isStaff && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-yellow-800 font-semibold">⚠️ Staff View Mode</p>
          <p className="text-yellow-700 text-sm">You have limited access. You can view users but cannot create new users or change roles.</p>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingId ? '✏️ Edit User' : '➕ Add New User'}</h2>
          {error && <p className="text-red-600 mb-4 font-semibold bg-red-50 p-3 rounded border border-red-200">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="User Name" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
            <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile Number" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
            <select name="role" value={form.role} onChange={handleChange} className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-600">
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password (leave blank to keep current)" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
            <input name="passwordHint" value={form.passwordHint} onChange={handleChange} placeholder="Password Hint (optional)" className="border-2 border-gray-300 p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-600" />
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={saveUser} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-md transition">
              {editingId ? '🔄 Update User' : '✅ Add User'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold shadow-md transition">
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
      )}

      <table className="w-full table-auto border-collapse mt-8 bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
        <thead>
          <tr className="bg-gradient-to-r from-gray-700 to-gray-800">
            <th className="px-6 py-4 text-left font-semibold text-white">ID</th>
            <th className="px-6 py-4 text-left font-semibold text-white">👤 Name</th>
            <th className="px-6 py-4 text-left font-semibold text-white">📧 Email</th>
            <th className="px-6 py-4 text-left font-semibold text-white">📱 Mobile</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🔑 Role</th>
            <th className="px-6 py-4 text-left font-semibold text-white">🔐 Password</th>
            <th className="px-6 py-4 text-left font-semibold text-white">✅ Status</th>
            <th className="px-6 py-4 text-left font-semibold text-white">⭐ Important</th>
            <th className="px-6 py-4 text-left font-semibold text-white">⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u, idx) => (
            <tr key={u._id} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-300 hover:bg-blue-50 transition`}>
              <td className="px-6 py-4 text-gray-900 font-medium">{u.customerId || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{u.name}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{u.email}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{u.mobile}</td>
              <td className="px-6 py-4">
                <select 
                  value={u.role} 
                  onChange={(e) => changeRole(u._id, e.target.value)}
                  className="border-2 border-gray-300 p-2 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:border-blue-600"
                  disabled={isStaff}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-6 py-4 break-all text-xs text-gray-900 font-medium">{u.password?.slice(0,40)}...</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${u.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {u.blocked ? '🔒 Blocked' : '✅ Active'}
                </span>
              </td>
              <td className="px-6 py-4">
                {u.role === 'customer' && isAdmin && (
                  <button
                    onClick={() => toggleImportantConsumer(u._id, u.importantConsumer || false)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${u.importantConsumer ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {u.importantConsumer ? '⭐ Yes' : '☆ No'}
                  </button>
                )}
                {u.role !== 'customer' && <span className="text-gray-500 text-sm">N/A</span>}
              </td>
              <td className="px-6 py-4 flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => startEdit(u)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    ✏️ Edit
                  </button>
                )}

                {isAdmin && u.role !== 'admin' && (
                  <button
                    onClick={() => toggleBlock(u._id, u.blocked)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold text-white transition ${u.blocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                  >
                    {u.blocked ? '🔓 Unblock' : '🔒 Block'}
                  </button>
                )}

                {isAdmin && u.role === 'customer' && (
                  <button
                    onClick={() => startConversation(u._id)}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                  >
                    💬 Start conversation
                  </button>
                )}

                {isAdmin && u.role !== 'admin' && (
                  <button onClick={() => deleteUser(u._id)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-semibold">
                    🗑️ Delete
                  </button>
                )}

                {isStaff && (
                  <span className="text-gray-500 text-sm italic">Read-only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
  blocked: boolean;
}

export default function AdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', passwordHint: '', role: 'staff' });
  const [error, setError] = useState('');
  const isAdmin = session?.user?.role === 'admin';
  const isStaff = session?.user?.role === 'staff';

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addUser = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '', role: 'staff' });
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add user');
    }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Remove user? This action cannot be undone.')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: !blocked }),
    });
    fetchUsers();
  };

  const changeRole = async (id: string, newRole: string) => {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      {isStaff && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
          <p className="text-yellow-800 font-semibold">⚠️ Staff View Mode</p>
          <p className="text-yellow-700 text-sm">You have limited access. You can view users but cannot create new users or change roles.</p>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Add User</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded" />
            <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" className="border p-2 rounded" />
            <select name="role" value={form.role} onChange={handleChange} className="border p-2 rounded">
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="border p-2 rounded" />
            <input name="passwordHint" value={form.passwordHint} onChange={handleChange} placeholder="Password Hint" className="border p-2 rounded" />
          </div>
          <button onClick={addUser} disabled={loading} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
            Add User
          </button>
        </div>
      )}

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Mobile</th>
            <th className="border px-4 py-2">Role</th>
            <th className="border px-4 py-2">Password Hash</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td className="border px-4 py-2">{u.name}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{u.mobile}</td>
              <td className="border px-4 py-2">
                <select 
                  value={u.role} 
                  onChange={(e) => changeRole(u._id, e.target.value)}
                  className="border p-1 rounded"
                  disabled={u.role === 'admin' || isStaff}
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="border px-4 py-2 break-all text-xs">{u.password?.slice(0,40)}...</td>
              <td className="border px-4 py-2">{u.blocked ? 'Blocked' : 'Active'}</td>
              <td className="border px-4 py-2">
                {isAdmin && u.role !== 'admin' && (
                  <button
                    onClick={() => toggleBlock(u._id, u.blocked)}
                    className={`mr-2 px-2 py-1 rounded text-sm font-semibold text-white ${u.blocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                  >
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                )}
                {isAdmin && u.role !== 'admin' && <button onClick={() => deleteUser(u._id)} className="text-red-600 hover:text-red-800 font-semibold text-sm">Delete</button>}
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
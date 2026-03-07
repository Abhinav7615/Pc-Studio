'use client';

import { useEffect, useState } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  blocked: boolean;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', passwordHint: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setForm({ name: '', email: '', mobile: '', password: '', passwordHint: '' });
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add user');
    }
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Remove staff?')) return;
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

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Staff Management</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Add Staff</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded" />
          <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" className="border p-2 rounded" />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" className="border p-2 rounded" />
          <input name="passwordHint" value={form.passwordHint} onChange={handleChange} placeholder="Password Hint" className="border p-2 rounded" />
        </div>
        <button onClick={addUser} disabled={loading} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
          Add Staff
        </button>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Mobile</th>
            <th className="border px-4 py-2">Role</th>
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
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">{u.blocked ? 'Blocked' : 'Active'}</td>
              <td className="border px-4 py-2">
                {u.role !== 'admin' && (
                  <button
                    onClick={() => toggleBlock(u._id, u.blocked)}
                    className={`mr-2 px-2 py-1 rounded ${u.blocked ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}
                  >
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                )}
                {u.role === 'staff' && <button onClick={() => deleteUser(u._id)} className="text-red-600">Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { useEffect, useState } from 'react';

interface Wishlist {
  _id: string;
  user: string;
  products: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function AdminWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlists = async () => {
      setLoading(true);
      const res = await fetch('/api/admin/wishlists');
      const data = await res.json();
      setWishlists(data.wishlists || []);
      setUsers(data.users || {});
      setLoading(false);
    };
    fetchWishlists();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">User Wishlists</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full table-auto border-collapse bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
          <thead>
            <tr className="bg-gradient-to-r from-pink-700 to-pink-800">
              <th className="px-6 py-4 text-left font-semibold text-white">User</th>
              <th className="px-6 py-4 text-left font-semibold text-white">Email</th>
              <th className="px-6 py-4 text-left font-semibold text-white"># Products</th>
              <th className="px-6 py-4 text-left font-semibold text-white">Product IDs</th>
            </tr>
          </thead>
          <tbody>
            {wishlists.map((w) => (
              <tr key={w._id} className="border-b border-gray-300 hover:bg-pink-50 transition">
                <td className="px-6 py-4">{users[w.user]?.name || w.user}</td>
                <td className="px-6 py-4">{users[w.user]?.email || ''}</td>
                <td className="px-6 py-4">{w.products.length}</td>
                <td className="px-6 py-4 break-all text-xs">{w.products.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

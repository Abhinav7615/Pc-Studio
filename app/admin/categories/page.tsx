"use client";
import { useEffect, useState } from "react";

interface Category {
  _id: string;
  name: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", icon: "", order: 0, isActive: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories);
  };

  useEffect(() => { fetchCategories(); }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (editing) {
      await fetch("/api/categories/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, _id: editing }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: "", icon: "", order: 0, isActive: true });
    setEditing(null);
    setLoading(false);
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon || '', order: cat.order, isActive: cat.isActive });
    setEditing(cat._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setLoading(true);
    await fetch("/api/categories/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    setLoading(false);
    fetchCategories();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 bg-white p-4 rounded shadow">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Category name" className="border p-2 rounded w-full" required />
        <input name="icon" value={form.icon} onChange={handleChange} placeholder="Icon (emoji or url)" className="border p-2 rounded w-full" />
        <input name="order" type="number" value={form.order} onChange={handleChange} placeholder="Order" className="border p-2 rounded w-full" />
        <label className="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Active
        </label>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{editing ? "Update" : "Add"} Category</button>
        {editing && <button type="button" className="ml-2 text-sm text-gray-500 underline" onClick={() => { setEditing(null); setForm({ name: "", icon: "", order: 0, isActive: true }); }}>Cancel</button>}
      </form>
      <div className="bg-white rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Icon</th>
              <th className="p-2">Order</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="border-b">
                <td className="p-2">{cat.name}</td>
                <td className="p-2">{cat.icon}</td>
                <td className="p-2">{cat.order}</td>
                <td className="p-2">{cat.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(cat)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => handleDelete(cat._id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

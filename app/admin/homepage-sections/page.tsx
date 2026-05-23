"use client";
import { useEffect, useState } from "react";

const sectionTypes = [
  { value: "banner", label: "Banner" },
  { value: "feature", label: "Feature" },
  { value: "custom", label: "Custom" },
];

export default function AdminHomepageSectionsPage() {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ type: "banner", title: "", subtitle: "", image: "", link: "", order: 0, isActive: true, content: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSections = async () => {
    const res = await fetch("/api/homepage-sections");
    const data = await res.json();
    setSections(data.sections);
  };

  useEffect(() => { fetchSections(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (editing) {
      await fetch("/api/homepage-sections/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, _id: editing }),
      });
    } else {
      await fetch("/api/homepage-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ type: "banner", title: "", subtitle: "", image: "", link: "", order: 0, isActive: true, content: "" });
    setEditing(null);
    setLoading(false);
    fetchSections();
  };

  const handleEdit = (section: any) => {
    setForm({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle || "",
      image: section.image || "",
      link: section.link || "",
      order: section.order,
      isActive: section.isActive,
      content: section.content || "",
    });
    setEditing(section._id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    setLoading(true);
    await fetch("/api/homepage-sections/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id }),
    });
    setLoading(false);
    fetchSections();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Homepage Sections</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 bg-white p-4 rounded shadow">
        <select name="type" value={form.type} onChange={handleChange} className="border p-2 rounded w-full">
          {sectionTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border p-2 rounded w-full" required />
        <input name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Subtitle" className="border p-2 rounded w-full" />
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="border p-2 rounded w-full" />
        <input name="link" value={form.link} onChange={handleChange} placeholder="Link URL" className="border p-2 rounded w-full" />
        <input name="order" type="number" value={form.order} onChange={handleChange} placeholder="Order" className="border p-2 rounded w-full" />
        <label className="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} /> Active
        </label>
        <textarea name="content" value={form.content} onChange={handleChange} placeholder="Custom content (for custom sections)" className="border p-2 rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{editing ? "Update" : "Add"} Section</button>
        {editing && <button type="button" className="ml-2 text-sm text-gray-500 underline" onClick={() => { setEditing(null); setForm({ type: "banner", title: "", subtitle: "", image: "", link: "", order: 0, isActive: true, content: "" }); }}>Cancel</button>}
      </form>
      <div className="bg-white rounded shadow">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Type</th>
              <th className="p-2">Title</th>
              <th className="p-2">Order</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section: any) => (
              <tr key={section._id} className="border-b">
                <td className="p-2">{section.type}</td>
                <td className="p-2">{section.title}</td>
                <td className="p-2">{section.order}</td>
                <td className="p-2">{section.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <button onClick={() => handleEdit(section)} className="text-blue-600 mr-2">Edit</button>
                  <button onClick={() => handleDelete(section._id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ sponsorName: '', sponsorEmail: '', amount: '', description: '' });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/billing/invoices');
      if (!res.ok) return;
      const data = await res.json();
      setInvoices(data.invoices || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createInvoice(e: any) {
    e.preventDefault();
    const payload = { sponsorName: form.sponsorName, sponsorEmail: form.sponsorEmail, amount: Number(form.amount), description: form.description };
    const res = await fetch('/api/admin/billing/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { setForm({ sponsorName: '', sponsorEmail: '', amount: '', description: '' }); load(); }
  }

  async function genPayLink(id: string) {
    const res = await fetch(`/api/admin/billing/invoices/${id}/pay-link`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      if (data.paymentLink) window.open(data.paymentLink, '_blank');
      else alert('Pay link created: ' + JSON.stringify(data));
      load();
    } else alert('Failed: ' + JSON.stringify(data));
  }

  async function markPaid(id: string) {
    const tx = prompt('Transaction ID (optional)');
    const res = await fetch(`/api/admin/billing/invoices/${id}/mark-paid`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: tx }) });
    if (res.ok) load(); else alert('Failed to mark paid');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>
      <div className="mb-6 p-4 bg-white rounded shadow">
        <form onSubmit={createInvoice} className="grid grid-cols-3 gap-4">
          <input placeholder="Sponsor name" value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} className="p-2 border" />
          <input placeholder="Sponsor email" value={form.sponsorEmail} onChange={(e) => setForm({ ...form, sponsorEmail: e.target.value })} className="p-2 border" />
          <input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="p-2 border" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-2 border col-span-2" />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create Invoice</button>
        </form>
      </div>

      <div className="bg-white rounded shadow">
        <table className="w-full table-auto">
          <thead>
            <tr><th className="p-2">#</th><th className="p-2">Sponsor</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr key={inv._id} className="border-t">
                <td className="p-2">{inv.invoiceNumber}</td>
                <td className="p-2">{inv.sponsorName || inv.sponsorEmail}</td>
                <td className="p-2">{inv.amount} {inv.currency}</td>
                <td className="p-2">{inv.status}</td>
                <td className="p-2">
                  <button onClick={() => genPayLink(inv._id)} className="mr-2 px-2 py-1 bg-green-600 text-white rounded">Pay Link</button>
                  <button onClick={() => markPaid(inv._id)} className="px-2 py-1 bg-indigo-600 text-white rounded">Mark Paid</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SupportTicketFormProps {
  onSuccess?: () => void;
  relatedOrderId?: string;
  defaultCategory?: 'ticket' | 'cancellation' | 'shipping' | 'general-support';
}

export default function SupportTicketForm({ onSuccess, relatedOrderId, defaultCategory = 'general-support' }: SupportTicketFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          description: description.trim(),
          relatedOrder: relatedOrderId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create support ticket');
        return;
      }

      setSuccess(true);
      setSubject('');
      setDescription('');
      setCategory(defaultCategory);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/support-tickets/${data.ticket._id}`);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900">Create Support Ticket</h3>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Support ticket created successfully! Redirecting...
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          <option value="general-support">General Support</option>
          <option value="ticket">Ticket/Query</option>
          <option value="cancellation">Cancellation Request</option>
          <option value="shipping">Shipping Question</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief subject of your issue"
          required
          maxLength={200}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">{subject.length}/200</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail"
          required
          rows={5}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">Provide as much detail as possible</p>
      </div>

      <button
        type="submit"
        disabled={loading || !subject.trim() || !description.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
}

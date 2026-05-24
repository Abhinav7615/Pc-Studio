'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SupportTicketForm from '@/components/SupportTicketForm';

interface SupportTicket {
  _id: string;
  subject: string;
  category: 'ticket' | 'cancellation' | 'shipping' | 'general-support';
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export default function SupportTicketsList({ admin = false }: { admin?: boolean } = {}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    fetchTickets();
  }, [admin]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = admin ? '/api/support-tickets?admin=1' : '/api/support-tickets';
      const res = await fetch(url);
      if (!res.ok) {
        setError('Failed to load tickets');
        return;
      }
      const data = await res.json();
      setTickets(data.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'waiting-customer': 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-slate-100 text-slate-800',
  };

  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-slate-600">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Support Tickets</h1>
        {!admin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Create New Ticket'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {!admin && showForm && (
        <SupportTicketForm
          onSuccess={() => {
            setShowForm(false);
            fetchTickets();
          }}
        />
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        {tickets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-600">No support tickets found.</p>
            {!admin && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/support-tickets/${ticket._id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {ticket.subject}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">{ticket.category.replace('-', ' ')}</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Created {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('-', ' ')}
                    </span>
                    <span className={`text-sm font-semibold capitalize ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

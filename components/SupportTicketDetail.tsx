'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface SupportMessage {
  sender: 'customer' | 'admin' | 'system';
  message: string;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  category: 'ticket' | 'cancellation' | 'shipping' | 'general-support';
  description: string;
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface SupportTicketDetailProps {
  ticketId: string;
}

export default function SupportTicketDetail({ ticketId }: SupportTicketDetailProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/support-tickets/${ticketId}`);
      if (!res.ok) {
        setError('Failed to load ticket');
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !message.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        setError('Failed to send message');
        return;
      }

      const data = await res.json();
      setTicket(data.ticket);
      setMessage('');
      setError('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-slate-600">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        {error || 'Ticket not found'}
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{ticket.subject}</h2>
            <p className="mt-1 text-sm text-slate-600">Ticket ID: {ticket._id}</p>
          </div>
          <Link href="/support-tickets" className="text-blue-600 hover:text-blue-700">
            ← Back to Tickets
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
            <p className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[ticket.status]}`}>
              {ticket.status.replace('-', ' ')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</p>
            <p className={`mt-1 text-sm font-semibold capitalize ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</p>
            <p className="mt-1 text-sm font-medium capitalize">{ticket.category.replace('-', ' ')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</p>
            <p className="mt-1 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Conversation</h3>

        <div className="mb-6 max-h-96 space-y-4 overflow-y-auto rounded-lg bg-slate-50 p-4">
          {ticket.messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-lg p-3 ${
                  msg.sender === 'customer'
                    ? 'bg-blue-600 text-white'
                    : msg.sender === 'admin'
                      ? 'bg-green-100 text-slate-900'
                      : 'bg-slate-200 text-slate-900'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                  {msg.sender === 'customer' ? 'You' : msg.sender === 'admin' ? 'Support Team' : 'System'}
                </p>
                <p className="mt-1 break-words text-sm">{msg.message}</p>
                <p className="mt-1 text-xs opacity-75">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import SupportTicketsList from '@/components/SupportTicketsList';

export default function AdminSupportTicketsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Support Tickets (Admin)</h1>
      <SupportTicketsList admin />
    </div>
  );
}

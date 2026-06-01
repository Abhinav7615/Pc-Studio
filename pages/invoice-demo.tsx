import React from 'react';
import InvoiceTemplate from '@/components/InvoiceTemplate';

const demoData = {
  invoiceNumber: 'INV-12345',
  invoiceDate: '31 May 2026',
  status: 'PAID',
  company: {
    name: 'PC Studio',
    address: '123 Main Street, Mumbai, MH 400001',
    gst: '27AAAPL1234C1ZV',
    email: 'support@pcstudio.com',
    phone: '+91-9876543210',
  },
  order: { id: 'ORD-98765', date: '30 May 2026', paymentMethod: 'Credit Card (HDFC)', shippingMethod: 'Delhivery Express' },
  customer: { name: 'John Doe', address: '501, Palm Residency, Andheri West, Mumbai, Maharashtra 400053', phone: '+91-9000000000' },
  shipping: { name: 'John Doe', address: '501, Palm Residency, Andheri West, Mumbai, Maharashtra 400053', courier: 'Delhivery', tracking: 'DLV1234567890', status: 'Delivered', deliveredOn: '31 May 2026, 2:30 PM', trackingLink: 'https://delhivery.com/track/DLV1234567890' },
  products: [
    { name: 'Lenovo ThinkPad E14 Gen 4', qty: 1, price: 54999, total: 54999 },
    { name: 'Logitech MX Master 3S Mouse', qty: 2, price: 7499, total: 14998 },
    { name: 'HP 27" QHD Monitor', qty: 1, price: 19999, total: 19999 },
  ],
  subtotal: 89996,
  discount: 2000,
  grandTotal: 87996,
};

export default function InvoiceDemoPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button onClick={handlePrint} style={{ padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 6, border: 'none' }}>
          Print / Save as PDF
        </button>
      </div>
      <InvoiceTemplate invoice={demoData as any} />
    </div>
  );
}

import React from 'react';

type Product = { name: string; qty: number; price: number; total: number };

type Invoice = {
  invoiceNumber: string;
  invoiceDate: string;
  status?: string;
  company: { name: string; address: string; gst?: string; email?: string; phone?: string };
  order?: { id?: string; date?: string; paymentMethod?: string; shippingMethod?: string };
  customer: { name: string; address: string; phone?: string };
  shipping?: { name?: string; address?: string; courier?: string; tracking?: string; trackingLink?: string; deliveredOn?: string };
  products: Product[];
  subtotal: number;
  discount?: number;
  grandTotal: number;
};

const rupee = (n: number) => {
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

export default function InvoiceTemplate({ invoice }: { invoice: Invoice }) {
  return (
    <div style={{ padding: 24, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <style>{`
        .invoice-root { background: #fff; color: #111; max-width: 900px; margin: 0 auto; border: 1px solid #e6e6e6; }
        .invoice-header { display:flex; justify-content:space-between; padding:24px; border-bottom:1px solid #eee; }
        .brand { font-weight:700; font-size:20px; }
        .meta { text-align:right; font-size:13px; color:#444 }
        .section { padding:20px 24px; }
        .cols { display:flex; gap:24px; }
        .col { flex:1 }
        .table { width:100%; border-collapse:collapse; margin-top:12px; }
        .table th, .table td { padding:10px 8px; border-bottom:1px solid #eee; text-align:left; font-size:13px }
        .table th { background:#fafafa; font-weight:600; color:#222 }
        .right { text-align:right }
        .totals { margin-top:12px; float:right; width:320px; }
        .totals .row { display:flex; justify-content:space-between; padding:6px 0; font-size:14px }
        .grand { font-weight:700; font-size:16px; }
        @media print { body { -webkit-print-color-adjust: exact } .invoice-root { border: none; box-shadow:none } }
      `}</style>

      <div className="invoice-root">
        <div className="invoice-header">
          <div>
            <div className="brand">{invoice.company.name}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#333' }}>{invoice.company.address}</div>
            {invoice.company.gst && <div style={{ marginTop: 6, fontSize: 13 }}>GSTIN: {invoice.company.gst}</div>}
          </div>
          <div className="meta">
            <div style={{ fontSize: 18, fontWeight: 700 }}>{invoice.status ?? 'INVOICE'}</div>
            <div style={{ marginTop: 6 }}>Invoice: <strong>{invoice.invoiceNumber}</strong></div>
            <div>{invoice.invoiceDate}</div>
            {invoice.order?.id && <div style={{ marginTop: 6 }}>Order: <strong>{invoice.order.id}</strong></div>}
          </div>
        </div>

        <div className="section cols">
          <div className="col">
            <div style={{ fontSize: 13, fontWeight: 600 }}>Bill To</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>{invoice.customer.name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#444' }}>{invoice.customer.address}</div>
            {invoice.customer.phone && <div style={{ marginTop: 6, fontSize: 13 }}>{invoice.customer.phone}</div>}
          </div>

          <div className="col">
            <div style={{ fontSize: 13, fontWeight: 600 }}>Ship To</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>{invoice.shipping?.name ?? invoice.customer.name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#444' }}>{invoice.shipping?.address ?? invoice.customer.address}</div>
            {invoice.shipping?.courier && (
              <div style={{ marginTop: 6, fontSize: 13 }}>Courier: {invoice.shipping.courier}</div>
            )}
            {invoice.shipping?.tracking && (
              <div style={{ marginTop: 6, fontSize: 13 }}>Tracking: {invoice.shipping.tracking}</div>
            )}
          </div>
        </div>

        <div className="section">
          <table className="table" role="table">
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Description</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }} className="right">Unit</th>
                <th style={{ width: '15%' }} className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.qty}</td>
                  <td className="right">{rupee(p.price)}</td>
                  <td className="right">{rupee(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals" style={{ clear: 'both' }}>
            <div className="row"><div>Subtotal</div><div>{rupee(invoice.subtotal)}</div></div>
            {invoice.discount ? <div className="row"><div>Discount</div><div>- {rupee(invoice.discount)}</div></div> : null}
            <div className="row grand"><div>Grand Total</div><div>{rupee(invoice.grandTotal)}</div></div>
          </div>
        </div>

        <div className="section" style={{ borderTop: '1px solid #f3f3f3', fontSize: 13, color: '#555' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Payment Method</div>
              <div style={{ marginTop: 6 }}>{invoice.order?.paymentMethod ?? '-'}</div>
            </div>

            <div>
              <div style={{ fontWeight: 600 }}>Contact</div>
              <div style={{ marginTop: 6 }}>{invoice.company.email ?? ''}</div>
              <div style={{ marginTop: 2 }}>{invoice.company.phone ?? ''}</div>
            </div>
          </div>

          <div style={{ marginTop: 18, fontSize: 12, color: '#666' }}>
            This is a computer-generated invoice and does not require a signature.
          </div>
        </div>
      </div>
    </div>
  );
}

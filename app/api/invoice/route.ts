import { NextResponse } from 'next/server';

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

function rupee(n: number) {
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function buildHtml(inv: Invoice) {
  const productsHtml = inv.products
    .map(
      (p) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee">${p.name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee">${p.qty}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${rupee(p.price)}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${rupee(p.total)}</td>
        </tr>`
    )
    .join('\n');

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Invoice ${inv.invoiceNumber}</title>
    <style>
      body { font-family: Inter, system-ui, -apple-system, Arial; color:#111; }
      .root { max-width:900px;margin:24px auto;border:1px solid #e6e6e6;padding:16px;background:#fff }
      .header { display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:12px }
      .brand { font-weight:700;font-size:20px }
      .meta { text-align:right;color:#444 }
      table { width:100%;border-collapse:collapse;margin-top:12px }
    </style>
  </head>
  <body>
    <div class="root">
      <div class="header">
        <div>
          <div class="brand">${inv.company.name}</div>
          <div style="margin-top:6px">${inv.company.address}</div>
          <div style="margin-top:6px">${inv.company.gst ?? ''}</div>
        </div>
        <div class="meta">
          <div style="font-weight:700">${inv.status ?? 'INVOICE'}</div>
          <div>Invoice: <strong>${inv.invoiceNumber}</strong></div>
          <div>${inv.invoiceDate}</div>
        </div>
      </div>

      <div style="display:flex;gap:24px;margin-top:16px">
        <div style="flex:1">
          <div style="font-weight:600">Bill To</div>
          <div style="margin-top:8px">${inv.customer.name}</div>
          <div style="margin-top:4px;color:#444">${inv.customer.address}</div>
        </div>
        <div style="flex:1">
          <div style="font-weight:600">Ship To</div>
          <div style="margin-top:8px">${inv.shipping?.name ?? inv.customer.name}</div>
          <div style="margin-top:4px;color:#444">${inv.shipping?.address ?? inv.customer.address}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee">Description</th>
            <th style="padding:10px;border-bottom:1px solid #eee">Qty</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #eee">Unit</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #eee">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
      </table>

      <div style="width:320px;margin-left:auto;margin-top:12px">
        <div style="display:flex;justify-content:space-between;padding:6px 0">Subtotal <span>${rupee(inv.subtotal)}</span></div>
        ${inv.discount ? `<div style="display:flex;justify-content:space-between;padding:6px 0">Discount <span>- ${rupee(inv.discount)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:700;padding:6px 0">Grand Total <span>${rupee(inv.grandTotal)}</span></div>
      </div>

      <div style="margin-top:18px;color:#666;font-size:12px">This is a computer generated invoice.</div>
    </div>
  </body>
  </html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoice = body.invoice as Invoice | undefined;
    if (!invoice) {
      return NextResponse.json({ error: 'Missing invoice in request body' }, { status: 400 });
    }

    const html = buildHtml(invoice);
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

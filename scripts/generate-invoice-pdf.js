/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

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
  shipping: { name: 'John Doe', address: '501, Palm Residency, Andheri West, Mumbai, Maharashtra 400053', courier: 'Delhivery', tracking: 'DLV1234567890', status: 'Delivered', deliveredOn: '31 May 2026, 2:30 PM' },
  products: [
    { name: 'Lenovo ThinkPad E14 Gen 4', qty: 1, price: 54999, total: 54999 },
    { name: 'Logitech MX Master 3S Mouse', qty: 2, price: 7499, total: 14998 },
    { name: 'HP 27\" QHD Monitor', qty: 1, price: 19999, total: 19999 },
  ],
  subtotal: 89996,
  discount: 2000,
  grandTotal: 87996,
};

function rupee(n) {
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function buildHtml(inv) {
  const productsHtml = inv.products.map(p => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee">${p.name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee">${p.qty}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${rupee(p.price)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${rupee(p.total)}</td>
    </tr>`).join('\n');

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
          <div style="margin-top:6px">GSTIN: ${inv.company.gst}</div>
        </div>
        <div class="meta">
          <div style="font-weight:700">${inv.status}</div>
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
        <div style="display:flex;justify-content:space-between;padding:6px 0">Discount <span>- ${rupee(inv.discount)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;padding:6px 0">Grand Total <span>${rupee(inv.grandTotal)}</span></div>
      </div>

      <div style="margin-top:18px;color:#666;font-size:12px">This is a computer generated invoice.</div>
    </div>
  </body>
  </html>`;
}

(async () => {
  const html = buildHtml(demoData);
  const outPath = path.join(process.cwd(), 'invoice-demo.pdf');

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outPath, format: 'A4', printBackground: true });
  await browser.close();
  console.log('Saved PDF to', outPath);
})();

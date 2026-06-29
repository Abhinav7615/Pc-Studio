import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

interface CashfreeOrderResp { order_id?: string; payment_session_id?: string; payment_link?: string }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const isTestCredential = appId?.startsWith('TEST') || secretKey?.includes('_test_');
    const defaultEnv = isTestCredential ? 'sandbox' : 'production';
    let environment = process.env.CASHFREE_ENV || defaultEnv;

    if (!appId || !secretKey) return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    if (environment === 'production' && isTestCredential) environment = 'sandbox';

    const apiUrl = environment === 'production' ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders';

    const baseUrl = process.env.NEXTAUTH_URL || `https://localhost:3000`;

    const payload = {
      order_id: `INV-${invoice._id.toString()}`,
      order_amount: Number(invoice.amount),
      order_currency: invoice.currency || 'INR',
      customer_details: {
        customer_id: invoice.sponsor?.toString() || invoice.sponsorEmail || 'guest',
        customer_name: invoice.sponsorName || 'Sponsor',
        customer_email: invoice.sponsorEmail || '',
        customer_phone: invoice.sponsorPhone || '',
      },
      order_meta: {
        return_url: `${baseUrl}/admin/billing/invoices/${invoice._id}`,
        notify_url: `${baseUrl}/api/payments/webhook`,
      },
      order_note: invoice.description || 'Ad Sponsorship Invoice',
    };

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId!,
        'x-client-secret': secretKey!,
      },
      body: JSON.stringify(payload),
    });

    const data: CashfreeOrderResp = await resp.json();
    if (!resp.ok) {
      console.error('Cashfree create order failed', data);
      return NextResponse.json({ error: 'Failed to create payment order', details: data }, { status: 502 });
    }

    invoice.cfOrderId = data.order_id as string;
    invoice.paymentSessionId = data.payment_session_id as string;
    await invoice.save();

    return NextResponse.json({ paymentLink: data.payment_link || null, orderId: data.order_id, sessionId: data.payment_session_id });
  } catch (err) {
    console.error('POST /api/admin/billing/invoices/[id]/pay-link error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const q: any = {};
    if (status) q.status = status;

    const invoices = await Invoice.find(q).sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({ invoices });
  } catch (err) {
    console.error('GET /api/admin/billing/invoices error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { sponsorId, sponsorName, sponsorEmail, sponsorPhone, adId, campaignId, description, amount, dueDate } = body;

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    await dbConnect();

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
    const inv = new Invoice({
      invoiceNumber,
      sponsor: sponsorId,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      ad: adId,
      campaign: campaignId,
      description,
      amount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
    });

    await inv.save();

    return NextResponse.json({ invoice: inv }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/billing/invoices error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

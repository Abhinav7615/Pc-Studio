import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoiceId = resolvedParams.id;
    await dbConnect();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const body = await request.json();
    const { transactionId } = body;

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    if (transactionId) invoice.transactionId = transactionId;
    await invoice.save();

    return NextResponse.json({ invoice });
  } catch (err) {
    console.error('POST /api/admin/billing/invoices/[id]/mark-paid error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

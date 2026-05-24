import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isAdminView = searchParams.get('admin') === '1';

    let tickets;
    if (isAdminView && (session.user.role === 'admin' || session.user.role === 'staff')) {
      // Admin/staff can view all tickets
      tickets = await SupportTicket.find({})
        .populate('customer', 'name email')
        .populate('relatedOrder', 'orderNumber status')
        .sort({ createdAt: -1 });
    } else {
      // Customer can view only their tickets
      tickets = await SupportTicket.find({
        customer: session.user.id,
      })
        .populate('customer', 'name email')
        .populate('relatedOrder', 'orderNumber status')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error('Get support tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, description, relatedOrder } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const ticket = new SupportTicket({
      customer: session.user.id,
      subject: subject.trim(),
      category: category || 'general-support',
      description: description.trim(),
      relatedOrder: relatedOrder || undefined,
      messages: [
        {
          sender: 'customer',
          message: description.trim(),
          createdAt: new Date(),
        },
      ],
      priority: 'medium',
      status: 'open',
    });

    await ticket.save();
    await ticket.populate('customer', 'name email');

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

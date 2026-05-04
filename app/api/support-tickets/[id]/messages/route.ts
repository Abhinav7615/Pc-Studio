import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await dbConnect();

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user is authorized (customer who owns it or admin)
    const isCustomer = ticket.customer.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'staff';

    if (!isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cannot add messages to closed tickets (except admin)
    if (!isAdmin && ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot add messages to closed tickets' },
        { status: 400 }
      );
    }

    // Add message to ticket
    const sender = isAdmin ? 'admin' : 'customer';
    ticket.messages.push({
      sender,
      message: message.trim(),
      createdAt: new Date(),
    });

    // Auto-update status if customer sends message and ticket is resolved
    if (isCustomer && ticket.status === 'resolved') {
      ticket.status = 'waiting-customer';
    }

    await ticket.save();
    await ticket.populate('customer', 'name email');

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error('Add support ticket message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const ticket = await SupportTicket.findById(id).populate('customer', 'name email');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check authorization
    if (
      ticket.customer._id.toString() !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'staff'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ messages: ticket.messages }, { status: 200 });
  } catch (error) {
    console.error('Get support ticket messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

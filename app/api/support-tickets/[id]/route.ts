import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';

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

    const ticket = await SupportTicket.findById(id)
      .populate('customer', 'name email')
      .populate('relatedOrder', 'orderNumber status total');

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user is authorized to view this ticket
    if (
      ticket.customer._id.toString() !== session.user.id &&
      session.user.role !== 'admin' &&
      session.user.role !== 'staff'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error('Get support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    await dbConnect();

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check authorization
    const isCustomer = ticket.customer.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin' || session.user.role === 'staff';

    if (!isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Customer can only update subject and description for open tickets
    if (isCustomer && !isAdmin) {
      if (ticket.status !== 'open') {
        return NextResponse.json(
          { error: 'Can only update open tickets' },
          { status: 400 }
        );
      }
      if (body.subject) ticket.subject = body.subject.trim();
      if (body.description) ticket.description = body.description.trim();
    } else {
      // Admin can update more fields
      if (body.status) ticket.status = body.status;
      if (body.priority) ticket.priority = body.priority;
      if (body.resolution) ticket.resolution = body.resolution.trim();
      if (body.assignedTo) ticket.assignedTo = body.assignedTo;
      if (body.tags) ticket.tags = body.tags;

      if (body.status === 'resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
    }

    await ticket.save();
    await ticket.populate('customer', 'name email');

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    console.error('Update support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const ticket = await SupportTicket.findByIdAndDelete(id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Ticket deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete support ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import CardOrder from '@/models/PremiumCardOrder';
import Card from '@/models/PremiumCard';
import CardInventory from '@/models/PremiumCardInventory';
import { notifyAdminsOrderUpdate } from '@/telegramBot/helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  await dbConnect();
  const { id } = await params;
  const order = await CardOrder.findById(id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const targetStatus = body.status || order.status;

  if (targetStatus === 'approved' && order.status !== 'approved') {
    // For approval step: mark approvedAt. Do NOT release card details or decrement inventory yet.
  }

  if (targetStatus === 'rejected') {
    order.cardDetails = null;
  }
  // Handle release as a separate step: set cardDetails (from body or card model), decrement inventory, and mark releasedAt
  if (targetStatus === 'released' && order.status !== 'released') {
    // Merge admin-provided details with card model so partial input still yields full details
    const card = await Card.findById(order.cardId);
    const cardModelDetails = card ? {
      name: card.name,
      categoryName: card.categoryName,
      network: card.network,
      balance: card.balance,
      holderName: card.holderName,
      cardNumber: card.cardNumber,
      expiry: card.expiry,
      cvv: card.cvv,
      zip: card.zip,
      billingAddress: card.billingAddress,
      country: card.country,
      bank: card.bank,
      image: card.image,
    } : {};

    if (body.cardDetails && Object.keys(body.cardDetails).length > 0) {
      order.cardDetails = { ...cardModelDetails, ...body.cardDetails };
    } else {
      order.cardDetails = cardModelDetails;
    }
    // Decrement inventory for the reserved card if it exists (safe no-op if missing)
    try {
      const card = await Card.findById(order.cardId);
      if (card) {
        const inventory = await CardInventory.findOne({ cardId: card._id });
        const available = (inventory?.availableQuantity ?? 0) - 1;
        const soldOut = available <= 0;
        await CardInventory.findOneAndUpdate({ cardId: card._id }, { availableQuantity: Math.max(0, available), soldQuantity: (inventory?.soldQuantity ?? 0) + 1, soldOut }, { upsert: true, new: true });
        await Card.findByIdAndUpdate(card._id, { soldOut, updatedAt: new Date() });
      }
    } catch (_e) {
      // ignore inventory errors
    }
    order.releasedAt = new Date();
  }

  order.status = targetStatus;
  order.adminNote = body.adminNote || order.adminNote;
  order.utrNumber = body.utrNumber || order.utrNumber;
  order.transactionId = body.transactionId || order.transactionId;
  order.remark = body.remark || order.remark;
  order.paymentScreenshot = body.paymentScreenshot || order.paymentScreenshot;
  order.approvedAt = targetStatus === 'approved' ? new Date() : order.approvedAt;
  order.rejectedAt = targetStatus === 'rejected' ? new Date() : order.rejectedAt;
  await order.save();

  const notifyMsg = targetStatus === 'released' ? 'Payment verified and card details released' : targetStatus === 'approved' ? 'Payment verified' : targetStatus === 'rejected' ? 'Payment rejected' : 'Order updated';
  void notifyAdminsOrderUpdate(order, notifyMsg);
  return NextResponse.json(order);
}

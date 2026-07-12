import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Card from '@/models/PremiumCard';
import CardInventory from '@/models/PremiumCardInventory';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'staff';
  const includeSensitive = isAdmin || request.headers.get('x-admin-access') === 'true';
  const { id } = await params;
  const card = await Card.findById(id).lean();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  const inventory = await CardInventory.findOne({ cardId: card._id }).lean();
  if (!includeSensitive) {
    return NextResponse.json({
      _id: card._id,
      name: card.name,
      network: card.network,
      balance: card.balance,
      price: card.price,
      image: card.image,
      categoryName: card.categoryName,
      description: card.description,
      availableQuantity: inventory?.availableQuantity ?? 0,
      soldOut: inventory?.soldOut ?? card.soldOut,
    });
  }
  return NextResponse.json({ ...card, availableQuantity: inventory?.availableQuantity ?? 0, soldOut: inventory?.soldOut ?? card.soldOut });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  await dbConnect();
  const { id } = await params;
  const card = await Card.findByIdAndUpdate(id, { ...body, updatedAt: new Date() }, { new: true });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  if (body.availableQuantity !== undefined) {
    await CardInventory.findOneAndUpdate({ cardId: card._id }, { availableQuantity: Number(body.availableQuantity || 0), soldOut: Number(body.availableQuantity || 0) <= 0 }, { upsert: true, new: true });
  }
  return NextResponse.json(card);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const { id } = await params;
  await Card.findByIdAndDelete(id);
  await CardInventory.deleteMany({ cardId: id });
  return NextResponse.json({ success: true });
}

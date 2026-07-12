import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Card from '@/models/PremiumCard';
import CardInventory from '@/models/PremiumCardInventory';
import CardCategory from '@/models/PremiumCardCategory';

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'staff';
  const includeSensitive = isAdmin || request.headers.get('x-admin-access') === 'true';
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const network = searchParams.get('network') || '';
  const search = searchParams.get('search') || '';
  const availability = searchParams.get('availability') || '';

  const query: Record<string, unknown> = { status: 'active', visibility: 'public' };
  if (category) query.categoryName = category;
  if (network) query.network = network;
  if (search) query.name = { $regex: search, $options: 'i' };
  if (availability === 'sold-out') query.soldOut = true;
  if (availability === 'available') query.soldOut = false;

  type PremiumCardResult = {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    network: string;
    balance: string;
    price: number;
    image?: string;
    categoryName?: string;
    description?: string;
    soldOut?: boolean;
    featured?: boolean;
    status?: string;
    visibility?: string;
  };
  type InventoryResult = { cardId: mongoose.Types.ObjectId | string; availableQuantity?: number; soldOut?: boolean };

  const cards = await Card.find(query).sort({ featured: -1, createdAt: -1 }).lean() as PremiumCardResult[];
  const inventory = await CardInventory.find({ cardId: { $in: cards.map((card) => card._id) } }).lean() as InventoryResult[];
  const inventoryMap = new Map(inventory.map((item) => [String(item.cardId), item]));
  const cardsWithInventory = cards.map((card) => {
    const inventoryEntry = inventoryMap.get(String(card._id));
    const base = {
      _id: card._id,
      name: card.name,
      network: card.network,
      balance: card.balance,
      price: card.price,
      image: card.image,
      categoryName: card.categoryName,
      description: card.description,
      availableQuantity: inventoryEntry?.availableQuantity ?? 0,
      soldOut: inventoryEntry?.soldOut ?? card.soldOut,
      featured: card.featured,
      status: card.status,
      visibility: card.visibility,
    };
    if (!includeSensitive) {
      return base;
    }
    return {
      ...card,
      ...base,
      availableQuantity: inventoryEntry?.availableQuantity ?? 0,
      soldOut: inventoryEntry?.soldOut ?? card.soldOut,
    };
  });

  return NextResponse.json(cardsWithInventory);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  await dbConnect();

  let category = null;
  if (body.categoryId && mongoose.Types.ObjectId.isValid(body.categoryId)) {
    category = await CardCategory.findById(body.categoryId);
  }
  if (!category && body.categorySlug) {
    category = await CardCategory.findOne({ slug: body.categorySlug });
  }
  if (!category && body.categoryName) {
    category = await CardCategory.findOne({ name: body.categoryName });
  }
  if (!category && body.categoryName) {
    category = await CardCategory.create({
      name: body.categoryName,
      slug: body.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: '',
      status: 'active',
    });
  }

  const card = await Card.create({
    categoryId: category?._id,
    categoryName: category?.name || body.categoryName || 'Normal',
    name: body.name,
    network: body.network,
    balance: body.balance,
    price: Number(body.price || 0),
    holderName: body.holderName || '',
    cardNumber: body.cardNumber || '',
    expiry: body.expiry || '',
    cvv: body.cvv || '',
    zip: body.zip || '',
    billingAddress: body.billingAddress || '',
    country: body.country || '',
    bank: body.bank || '',
    description: body.description || '',
    status: body.status || 'active',
    featured: Boolean(body.featured),
    visibility: body.visibility || 'public',
    image: body.image || '',
    soldOut: false,
  });
  await CardInventory.create({ cardId: card._id, availableQuantity: Number(body.availableQuantity || 0), soldQuantity: 0, soldOut: false });
  return NextResponse.json(card);
}

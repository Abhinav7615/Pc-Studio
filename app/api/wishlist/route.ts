import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const wishlist = await Wishlist.findOne({ user: session.user.id }).populate('products');
  return NextResponse.json({ wishlist: wishlist || { products: [] } });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }
  await dbConnect();
  let wishlist = await Wishlist.findOne({ user: session.user.id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: session.user.id, products: [productId] });
  } else if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    wishlist.updatedAt = new Date();
    await wishlist.save();
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }
  await dbConnect();
  const wishlist = await Wishlist.findOne({ user: session.user.id });
  if (wishlist && wishlist.products.includes(productId)) {
    wishlist.products = wishlist.products.filter((id: string) => id.toString() !== productId);
    wishlist.updatedAt = new Date();
    await wishlist.save();
  }
  return NextResponse.json({ success: true });
}

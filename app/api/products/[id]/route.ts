import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { resolveEndedAuction } from '@/lib/auctionHelper';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await resolveEndedAuction(product);

    return NextResponse.json(product, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, description, originalPrice, discountPercent, gstPercent, quantity, images, videos, marketMode, status, biddingStart, biddingEnd, categories } = await request.json();
    const normalizedDiscountPercent = discountPercent !== undefined && discountPercent !== null ? Number(discountPercent) : undefined;
    const normalizedGstPercent = gstPercent !== undefined && gstPercent !== null ? Number(gstPercent) : undefined;
    const parsedQuantity = quantity !== undefined && quantity !== null ? Number(quantity) : undefined;
    const mode = marketMode === 'auction' ? 'auction' : marketMode === 'bargain' ? 'bargain' : 'none';
    const updateData: Partial<{
      name: string;
      description: string;
      originalPrice: number;
      discountPercent: number;
      gstPercent: number;
      images: string[];
      videos: string[];
      quantity: number;
      bargainEnabled: boolean;
      biddingEnabled: boolean;
      marketMode: string;
      status: string;
      biddingStart: Date;
      biddingEnd: Date;
      categories: string[];
    }> = { name, description, originalPrice, images, videos };
    if (normalizedDiscountPercent !== undefined) updateData.discountPercent = normalizedDiscountPercent;
    if (normalizedGstPercent !== undefined) updateData.gstPercent = normalizedGstPercent;
    if (mode) {
      updateData.marketMode = mode;
      updateData.bargainEnabled = mode === 'bargain';
      updateData.biddingEnabled = mode === 'auction';
    }
    if (status !== undefined) {
      updateData.status = ['active', 'out-of-stock', 'new', 'archived'].includes(status) ? status : 'active';
    }
    if (biddingStart !== undefined) {
      updateData.biddingStart = biddingStart ? new Date(biddingStart) : undefined;
    }
    if (biddingEnd !== undefined) {
      updateData.biddingEnd = biddingEnd ? new Date(biddingEnd) : undefined;
    }
    if (parsedQuantity !== undefined) {
      updateData.quantity = parsedQuantity;
    }
    if (categories !== undefined) {
      updateData.categories = Array.isArray(categories) && categories.length > 0 ? categories : ['all'];
    }
    console.log('Updating product with quantity:', parsedQuantity, 'from input:', quantity);

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
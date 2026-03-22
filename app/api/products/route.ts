import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();

    const products = await Product.find({}).sort({ createdAt: -1 });

    return NextResponse.json(products, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, description, originalPrice, discountPercent, quantity, images, videos } = await request.json();

    if (!name || !description || !originalPrice) {
      return NextResponse.json({ error: 'Name, description, and original price are required' }, { status: 400 });
    }

    const parsedQuantity = quantity !== undefined && quantity !== null ? Number(quantity) : 0;
    console.log('Creating product with quantity:', parsedQuantity, 'from input:', quantity);

    const product = new Product({
      name,
      description,
      originalPrice,
      discountPercent: discountPercent || 0,
      quantity: parsedQuantity,
      images: images || [],
      videos: videos || [],
    });

    await product.save();

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { name, description, originalPrice, discountPercent, gstPercent, quantity, images, videos, marketMode, status, biddingStart, biddingEnd, categories, variants } = await request.json();
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
      variants: any[];
    }> = { name, description, originalPrice, images, videos };
    if (variants !== undefined) updateData.variants = Array.isArray(variants) ? variants : [];
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

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete associated media files if any
    try {
      const { getGridFSBucket } = await import('@/lib/mediaGridFS');
      const bucket = await getGridFSBucket({ bucketName: 'uploads' });

      const allFiles: string[] = [];
      if (Array.isArray(product.images)) allFiles.push(...product.images);
      if (Array.isArray(product.videos)) allFiles.push(...product.videos);

      for (const url of allFiles) {
        try {
          const fileName = ((): string => {
            try {
              const u = new URL(url, 'http://localhost');
              return u.searchParams.get('file') || u.pathname.split('/').pop() || url;
            } catch {
              return String(url);
            }
          })();

          const files = await bucket
            .find({ $or: [{ filename: fileName }, { 'metadata.originalName': fileName }] })
            .toArray();

          for (const f of files) {
            const metadata = await (MediaMetadata as any).findOne({ fileId: f._id.toString() });
            if (metadata) {
              await metadata.remove();
            }
            try {
              await bucket.delete(f._id);
            } catch (delErr) {
              console.error('Error deleting file from GridFS:', delErr);
            }
          }
        } catch (inner) {
          console.error('Failed to delete associated media for product:', inner);
        }
      }
    } catch (err) {
      console.error('Error during associated media cleanup:', err);
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
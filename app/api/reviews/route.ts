import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Review from '@/models/Review';

const sanitizeComment = (value: string) => {
  return String(value || '').trim().replace(/<[^>]*>/g, '');
};

const sanitizeReply = (value: string) => {
  return String(value || '').trim().replace(/<[^>]*>/g, '');
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const productId = request.nextUrl.searchParams.get('productId');
  const adminRequest = request.nextUrl.searchParams.get('admin');

  await dbConnect();

  if (!productId && !(session && (session.user.role === 'admin' || session.user.role === 'staff'))) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const query: any = {};
  if (productId) {
    query.product = productId;
  }

  if (!adminRequest || adminRequest !== 'true') {
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
  }

  try {
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('product', 'name')
      .populate('replyBy', 'name');

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? Number((reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews).toFixed(2)) : 0;

    let canReview = false;
    let hasReviewed = false;

    if (session?.user?.id && productId) {
      const existingReview = await Review.findOne({ user: session.user.id, product: productId });
      hasReviewed = !!existingReview;

      if (!hasReviewed) {
        const deliveredOrder = await Order.findOne({
          customer: session.user.id,
          status: 'Delivered',
          'products.product': productId,
        });
        canReview = !!deliveredOrder;
      }
    }

    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating,
      canReview,
      hasReviewed,
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const productId = String(body.productId || '').trim();
  const rating = Number(body.rating);
  const comment = sanitizeComment(body.comment);

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  if (!comment || comment.length < 10 || comment.length > 1000) {
    return NextResponse.json({ error: 'Comment must be between 10 and 1000 characters' }, { status: 400 });
  }

  await dbConnect();

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const deliveredOrder = await Order.findOne({
      customer: session.user.id,
      status: 'Delivered',
      'products.product': productId,
    });

    if (!deliveredOrder) {
      return NextResponse.json({ error: 'Review allowed only after you receive a delivered product' }, { status: 403 });
    }

    const existingReview = await Review.findOne({ user: session.user.id, product: productId });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    const review = await Review.create({
      user: session.user.id,
      product: productId,
      rating,
      comment,
    });

    return NextResponse.json({ message: 'Review submitted successfully', review }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/reviews error:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviewId = request.nextUrl.searchParams.get('id');
  if (!reviewId) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  const body = await request.json();
  const reply = sanitizeReply(body.reply || '');

  if (reply.length > 1000) {
    return NextResponse.json({ error: 'Reply must be 1000 characters or fewer' }, { status: 400 });
  }

  await dbConnect();

  try {
    const updateData: any = {};
    if (reply) {
      updateData.reply = reply;
      updateData.replyAt = new Date();
      updateData.replyBy = session.user.id;
    } else {
      updateData.$unset = { reply: '', replyAt: '', replyBy: '' };
    }

    const review = await Review.findByIdAndUpdate(reviewId, updateData, { new: true })
      .populate('user', 'name')
      .populate('product', 'name')
      .populate('replyBy', 'name');

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Reply saved successfully', review }, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviewId = request.nextUrl.searchParams.get('id');
  if (!reviewId) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

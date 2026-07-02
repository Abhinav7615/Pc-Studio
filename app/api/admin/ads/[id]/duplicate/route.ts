import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available', e); }

    const original = await Ad.findById(id);
    if (!original) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const cloned = new Ad({
      ...original.toObject(),
      _id: undefined, // Let MongoDB generate new ID
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await cloned.save();
    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/ads/[id]/duplicate error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

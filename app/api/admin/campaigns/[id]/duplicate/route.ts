import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Campaign from '@/models/Campaign';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available', e); }

    const original = await Campaign.findById(id);
    if (!original) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const cloned = new Campaign({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await cloned.save();
    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/campaigns/[id]/duplicate error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

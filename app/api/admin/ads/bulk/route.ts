import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, data } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available', e); }

    let result: any = null;

    if (action === 'enable') {
      result = await Ad.updateMany({ _id: { $in: ids } }, { $set: { status: 'active' } });
    } else if (action === 'disable') {
      result = await Ad.updateMany({ _id: { $in: ids } }, { $set: { status: 'disabled' } });
    } else if (action === 'delete') {
      result = await Ad.deleteMany({ _id: { $in: ids } });
    } else if (action === 'update') {
      result = await Ad.updateMany({ _id: { $in: ids } }, { $set: data || {} });
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err) {
    console.error('POST /api/admin/ads/bulk error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

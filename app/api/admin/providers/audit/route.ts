import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
const ProviderAudit = (await import('@/models/ProviderAudit')).default;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for provider audits', e); }

    const audits = await ProviderAudit.find().sort({ createdAt: -1 }).limit(500).populate('provider', 'name').lean();
    return NextResponse.json(audits, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/providers/audit error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

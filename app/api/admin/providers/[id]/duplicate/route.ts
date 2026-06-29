import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Provider from '@/models/Provider';
import ProviderAudit from '@/models/ProviderAudit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available', e); }

    const original = await Provider.findById(id);
    if (!original) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const cloned = new Provider({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await cloned.save();

    // Audit log
    try {
      const who = session?.user?.id || session?.user?.email || 'unknown';
      await ProviderAudit.create({
        provider: cloned._id,
        action: 'create',
        changedBy: session?.user?.id,
        changedByName: session?.user?.name || who,
        changes: { duplicatedFrom: id },
        ip: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch (_auditErr) { /* ignore */ }

    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/providers/[id]/duplicate error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Provider from '@/models/Provider';
import ProviderAudit from '@/models/ProviderAudit';

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
    const who = session?.user?.id || session?.user?.email || 'unknown';

    if (action === 'enable') {
      result = await Provider.updateMany({ _id: { $in: ids } }, { $set: { status: 'enabled' } });
      for (const id of ids) {
        try {
          await ProviderAudit.create({
            provider: id,
            action: 'update',
            changedBy: session?.user?.id,
            changedByName: session?.user?.name || who,
            changes: { status: 'enabled' },
            ip: request.headers.get('x-forwarded-for') || '',
            userAgent: request.headers.get('user-agent') || '',
          });
        } catch (_auditErr) { /* ignore */ }
      }
    } else if (action === 'disable') {
      result = await Provider.updateMany({ _id: { $in: ids } }, { $set: { status: 'disabled' } });
      for (const id of ids) {
        try {
          await ProviderAudit.create({
            provider: id,
            action: 'update',
            changedBy: session?.user?.id,
            changedByName: session?.user?.name || who,
            changes: { status: 'disabled' },
            ip: request.headers.get('x-forwarded-for') || '',
            userAgent: request.headers.get('user-agent') || '',
          });
        } catch (_auditErr) { /* ignore */ }
      }
    } else if (action === 'delete') {
      result = await Provider.deleteMany({ _id: { $in: ids } });
      for (const id of ids) {
        try {
          await ProviderAudit.create({
            provider: id,
            action: 'delete',
            changedBy: session?.user?.id,
            changedByName: session?.user?.name || who,
            changes: {},
            ip: request.headers.get('x-forwarded-for') || '',
            userAgent: request.headers.get('user-agent') || '',
          });
        } catch (_auditErr) { /* ignore */ }
      }
    } else if (action === 'update') {
      result = await Provider.updateMany({ _id: { $in: ids } }, { $set: data || {} });
      for (const id of ids) {
        try {
          await ProviderAudit.create({
            provider: id,
            action: 'update',
            changedBy: session?.user?.id,
            changedByName: session?.user?.name || who,
            changes: data || {},
            ip: request.headers.get('x-forwarded-for') || '',
            userAgent: request.headers.get('user-agent') || '',
          });
        } catch (_auditErr) { /* ignore */ }
      }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err) {
    console.error('POST /api/admin/providers/bulk error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

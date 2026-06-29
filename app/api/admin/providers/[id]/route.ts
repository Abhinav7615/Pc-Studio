import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Provider from '@/models/Provider';
import { sanitizeHtml } from '@/lib/ads/sanitize';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for providers', e); }
    const p = await Provider.findById(id);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for providers', e); }
    const payload = await request.json();
    if (payload.html) payload.html = sanitizeHtml(payload.html);
    if (payload.css) payload.css = sanitizeHtml(payload.css);
    if (!payload.allowJs) payload.javascript = '';
    const updated = await Provider.findByIdAndUpdate(id, payload, { new: true });

    // Audit log
    try {
      const who = session?.user?.id || session?.user?.email || 'unknown';
      await (await import('@/models/ProviderAudit')).default.create({
        provider: updated._id,
        action: 'update',
        changedBy: session?.user?.id,
        changedByName: session?.user?.name || who,
        changes: payload,
        ip: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch (auditErr) {
      console.warn('Failed to write provider audit', auditErr);
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for providers', e); }
    const deleted = await Provider.findByIdAndDelete(id);
    try {
      const who = session?.user?.id || session?.user?.email || 'unknown';
      await (await import('@/models/ProviderAudit')).default.create({
        provider: deleted?._id,
        action: 'delete',
        changedBy: session?.user?.id,
        changedByName: session?.user?.name || who,
        changes: {},
        ip: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch (auditErr) {
      console.warn('Failed to write provider audit', auditErr);
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

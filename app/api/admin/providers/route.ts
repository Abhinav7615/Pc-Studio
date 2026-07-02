import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Provider from '@/models/Provider';
import ProviderAudit from '@/models/ProviderAudit';
import { sanitizeHtml } from '@/lib/ads/sanitize';

export async function GET() {
  try {
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for providers', e); }
    const providers = await Provider.find({}).sort({ priority: -1 });
    return NextResponse.json(providers, { status: 200 });
  } catch (err) {
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
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for providers', e); }
    const payload = await request.json();
    // Sanitize HTML/CSS and avoid storing arbitrary JS unless explicitly allowed
    if (payload.html) payload.html = sanitizeHtml(payload.html);
    if (payload.css) payload.css = sanitizeHtml(payload.css);
    if (!payload.allowJs) payload.javascript = '';
    const p = new Provider(payload);
    await p.save();

    // Audit log
    try {
      const who = session?.user?.id || session?.user?.email || 'unknown';
      await ProviderAudit.create({ provider: p._id, action: 'create', changedBy: session?.user?.id, changedByName: session?.user?.name || who, changes: payload, ip: request.headers.get('x-forwarded-for') || '', userAgent: request.headers.get('user-agent') || '' });
    } catch (auditErr) {
      console.warn('Failed to write provider audit', auditErr);
    }

    return NextResponse.json(p, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

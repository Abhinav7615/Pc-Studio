import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const adId = body?.adId || null;
    const token = body?.token || null;

    if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for impressions', e); }

    const AdView = (await import('@/models/AdView')).default;
    // validate token
    try {
      const AdMessageToken = (await import('@/models/AdMessageToken')).default;
      const rec = await AdMessageToken.findOne({ ad: adId, token }).exec();
      if (!rec) return NextResponse.json({ error: 'invalid token' }, { status: 403 });
      rec.uses = (rec.uses || 0) + 1;
      await rec.save();
    } catch (verr) {
      console.warn('Token validation error', verr);
      return NextResponse.json({ error: 'token validation failed' }, { status: 500 });
    }

    await AdView.create({ ad: adId, ip: request.headers.get('x-forwarded-for') || '', userAgent: request.headers.get('user-agent') || '' });

    // increment impressions counter on Ad (best-effort)
    try { const Ad = (await import('@/models/Ad')).default; Ad.updateOne({ _id: adId }, { $inc: { impressions: 1 }, $set: { lastImpressionAt: new Date() } }).catch(() => {}); } catch (_) {}

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('POST /api/ads/impression error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

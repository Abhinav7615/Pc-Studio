import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adId = body?.adId;
    const token = body?.token;
    if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for ads', e); }
    // validate token
    try {
      const AdMessageToken = (await import('@/models/AdMessageToken')).default;
      const rec = await AdMessageToken.findOne({ ad: adId, token }).exec();
      if (!rec) return NextResponse.json({ error: 'invalid token' }, { status: 403 });
      // increment usage and mark used
      rec.uses = (rec.uses || 0) + 1;
      rec.used = true;
      await rec.save();
    } catch (verr) {
      console.warn('Token validation error', verr);
      return NextResponse.json({ error: 'token validation failed' }, { status: 500 });
    }

    await Ad.updateOne({ _id: adId }, { $inc: { clicks: 1 }, $set: { lastClickAt: new Date() } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('POST /api/ads/click error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

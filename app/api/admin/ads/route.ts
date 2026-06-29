import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';
import { sanitizeHtml } from '@/lib/ads/sanitize';

export async function GET() {
  try {
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for admin ads', e); }
    const ads = await Ad.find({}).sort({ createdAt: -1 });
    return NextResponse.json(ads, { status: 200 });
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
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for admin ads', e); }
    const payload = await request.json();
    // Sanitize HTML fields to avoid storing unsafe scripts
    if (payload.html) payload.html = sanitizeHtml(payload.html);
    if (payload.js) payload.js = ''; // Do not store arbitrary JS by default
    const ad = new Ad(payload);
    await ad.save();
    return NextResponse.json(ad, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/ads error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

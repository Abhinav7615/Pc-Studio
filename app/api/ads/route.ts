import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';
import crypto from 'crypto';
import AdMessageToken from '@/models/AdMessageToken';
import { selectAd } from '@/lib/ads/mediation';
import { sanitizeHtml } from '@/lib/ads/sanitize';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const zone = url.searchParams.get('zone') || 'default';

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for ads', e); }

    const now = new Date();
    const candidates = await Ad.find({
      zone,
      status: 'active',
      $and: [
        { $or: [ { startDate: { $exists: false } }, { startDate: { $lte: now } } ] },
        { $or: [ { endDate: { $exists: false } }, { endDate: { $gte: now } } ] },
      ],
    }).sort({ priority: -1, createdAt: -1 }).limit(50);

    if (!candidates || candidates.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // Basic targeting: use headers if provided
    const headers = request.headers;
    const country = headers.get('x-country') || headers.get('x-country-code') || '';
    const ua = headers.get('user-agent') || '';
    const loggedInHeader = headers.get('x-user-logged-in') || headers.get('x-user-loggedin') || '';
    const isLoggedIn = ['1','true','yes'].includes(loggedInHeader.toLowerCase());

    function detectDevice(userAgent: string) {
      const uaL = userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad|phone/.test(uaL)) return 'mobile';
      if (/tablet|ipad/.test(uaL)) return 'tablet';
      return 'desktop';
    }

    const deviceType = detectDevice(ua);

    const filteredByTargeting = candidates.filter((ad: any) => {
      try {
        const t = ad.targeting || {};
        if (t.loggedInOnly && !isLoggedIn) return false;
        if (Array.isArray(t.countries) && t.countries.length > 0) {
          if (!country) return false; // cannot confirm user's country
          const match = t.countries.map((c: string) => c.toLowerCase()).includes(country.toLowerCase());
          if (!match) return false;
        }
        if (Array.isArray(t.devices) && t.devices.length > 0) {
          if (!t.devices.includes(deviceType)) return false;
        }
        return true;
      } catch (_err) {
        return true;
      }
    });

    // Extract visitor and user info for frequency cap checks
    const visitorId = request.headers.get('x-visitor-id') || '';
    const userId = isLoggedIn ? (request.headers.get('x-user-id') || null) : null;

    // Use mediation selector to pick best ad
    const selection = await selectAd(filteredByTargeting.length ? filteredByTargeting as any[] : candidates as any[]);
    if (!selection) return new NextResponse(null, { status: 204 });
    let ad = selection.ad || selection;
    const providerMarkup = (selection as any).providerMarkup;
    const providerDoc = (selection as any).provider || null;
    // Frequency cap enforcement: if ad.frequencyCap > 0 check AdView count in last 24 hours
    try {
      const AdView = (await import('@/models/AdView')).default;
      if (ad.frequencyCap && ad.frequencyCap > 0) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const query: any = { ad: ad._id, createdAt: { $gte: since } };
        if (userId) query.userId = userId;
        else if (visitorId) query.visitorId = visitorId;
        const count = await AdView.countDocuments(query);
        if (count >= ad.frequencyCap) {
          // mark as exceeded and try to pick another ad
          const remaining = (filteredByTargeting.length ? filteredByTargeting as any[] : candidates as any[]).filter((a: any) => String(a._id) !== String(ad._id));
          const nextAd = await selectAd(remaining);
          if (!nextAd) return new NextResponse(null, { status: 204 });
          // use nextAd instead
          ad = nextAd as any;
        }
      }

      // persist AdView
      await AdView.create({ ad: ad._id, userId: userId || undefined, visitorId: visitorId || undefined, ip: request.headers.get('x-forwarded-for') || '', userAgent: request.headers.get('user-agent') || '' });
    } catch (err) {
      console.error('AdView tracking error', err);
    }

    // Increment impressions asynchronously and set lastImpressionAt
    Ad.updateOne({ _id: ad._id }, { $inc: { impressions: 1 }, $set: { lastImpressionAt: new Date() } }).catch(() => {});

    // create a persistent message token associated with this ad for verification
    const messageToken = crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : Math.random().toString(36).slice(2);
    try {
      const expires = new Date(Date.now() + 5 * 60 * 1000); // token valid for 5 minutes
      await AdMessageToken.create({ ad: ad._id, token: messageToken, expiresAt: expires });
    } catch (tokErr) {
      console.warn('Failed to create AdMessageToken', tokErr);
    }

    const payload = {
      _id: ad._id,
      title: ad.title,
      type: ad.type,
      html: providerMarkup ? sanitizeHtml(String(providerMarkup)) : (ad.html ? sanitizeHtml(ad.html) : undefined),
      image: ad.image,
      video: ad.video,
      iframeSrc: ad.iframeSrc,
      targetUrl: ad.targetUrl,
      provider: providerMarkup ? 'third-party' : undefined,
      providerAllowJs: providerDoc?.allowJs || false,
      providerCss: providerDoc?.css || undefined,
      messageToken,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('GET /api/ads error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

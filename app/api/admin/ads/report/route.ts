import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import AdView from '@/models/AdView';
import Ad from '@/models/Ad';

function toCSV(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = keys.join(',');
  const lines = rows.map(r => keys.map(k => esc(r[k])).join(','));
  return [header, ...lines].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const format = url.searchParams.get('format') || 'json';

    const start = startParam ? new Date(startParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endParam ? new Date(endParam) : new Date();

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for reports', e); }

    const agg = await AdView.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$ad', impressions: { $sum: 1 } } },
      { $lookup: { from: 'ads', localField: '_id', foreignField: '_id', as: 'ad' } },
      { $unwind: { path: '$ad', preserveNullAndEmptyArrays: true } },
      { $project: { adId: '$_id', impressions: 1, title: '$ad.title', clicks: '$ad.clicks', createdAt: '$ad.createdAt' } },
      { $sort: { impressions: -1 } },
    ]).allowDiskUse(true);

    const rows = agg.map((r: any) => ({
      adId: r.adId?.toString(),
      title: r.title || '',
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      ctr: r.impressions ? ((r.clicks || 0) / r.impressions) : 0,
    }));

    if (format === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="ads-report-${Date.now()}.csv"` } });
    }

    return NextResponse.json({ start, end, rows }, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/ads/report error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

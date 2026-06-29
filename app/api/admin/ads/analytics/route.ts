import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Ad from '@/models/Ad';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    // Simple aggregate: total impressions and clicks per ad
    const agg = await Ad.aggregate([
      { $project: { title: 1, impressions: 1, clicks: 1 } },
      { $sort: { impressions: -1 } },
      { $limit: 100 },
    ]);

    return NextResponse.json(agg, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

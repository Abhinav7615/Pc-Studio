import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Sponsor from '@/models/Sponsor';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { advertiserName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [sponsors, total] = await Promise.all([
      Sponsor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sponsor.countDocuments(query),
    ]);

    return NextResponse.json({
      data: sponsors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load sponsors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const sponsor = new Sponsor({
      ...body,
      status: body.status || 'draft',
      impressions: 0,
      clicks: 0,
    });

    await sponsor.save();
    return NextResponse.json(sponsor);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 });
  }
}

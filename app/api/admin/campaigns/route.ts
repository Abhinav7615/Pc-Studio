import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function GET() {
  try {
    await dbConnect();
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    return NextResponse.json(campaigns, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', session: null }, { status: 401 });
    }
    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      const sessionInfo = { id: session.user?.id || null, role: session.user?.role || null };
      return NextResponse.json({ error: 'Unauthorized', session: sessionInfo }, { status: 401 });
    }
    await dbConnect();
    const payload = await request.json().catch(() => ({}));
    if (!payload || !String(payload.name || '').trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }
    const c = new Campaign(payload);
    await c.save();
    return NextResponse.json(c, { status: 201 });
  } catch (err) {
    console.error('Create campaign error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Campaign from '@/models/Campaign';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for campaigns', e); }
    const c = await Campaign.findById(id);
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(c, { status: 200 });
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
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for campaigns', e); }
    const payload = await request.json();
    const updated = await Campaign.findByIdAndUpdate(id, payload, { new: true });
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
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for campaigns', e); }
    await Campaign.findByIdAndDelete(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for admin ads', e); }
    const a = await Ad.findById(resolvedParams.id);
    if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(a, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for admin ads', e); }
    const payload = await request.json();
    const updated = await Ad.findByIdAndUpdate(resolvedParams.id, payload, { new: true });
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available for admin ads', e); }
    await Ad.findByIdAndDelete(resolvedParams.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

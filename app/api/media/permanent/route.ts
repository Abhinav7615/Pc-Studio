import { NextRequest, NextResponse } from 'next/server';
import { permanentlyDeleteMedia } from '@/lib/mediaStorage';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { metadataId, deletedId } = await req.json();
    if (!metadataId && !deletedId) {
      return NextResponse.json({ error: 'metadataId or deletedId required' }, { status: 400 });
    }

    await dbConnect();

    const result = deletedId
      ? await permanentlyDeleteMedia(deletedId, 'deleted')
      : await permanentlyDeleteMedia(metadataId, 'metadata');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json({ error: 'Failed to permanently delete media' }, { status: 500 });
  }
}

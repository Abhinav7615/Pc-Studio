import { NextRequest, NextResponse } from 'next/server';
import { softDeleteMedia } from '@/lib/mediaStorage';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { metadataId, reason } = await req.json();

    if (!metadataId) return NextResponse.json({ error: 'metadataId required' }, { status: 400 });

    await dbConnect();

    const result = await softDeleteMedia(metadataId, session.user.id, reason || 'manual');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}

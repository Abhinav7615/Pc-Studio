import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { uploadBufferToGridFS } from '@/lib/mediaGridFS';
import { uploadMediaWithMetadata } from '@/lib/mediaStorage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Create a tiny test buffer
    const buffer = Buffer.from('media-cluster-test-' + Date.now());
    const filename = `media-cluster-test-${Date.now()}.txt`;

    const fileId = await uploadBufferToGridFS(buffer, filename, 'text/plain');

    // create a metadata record so admin UI shows it in Media Metadata tab
    const metadata = await uploadMediaWithMetadata(
      fileId.toString(),
      filename,
      buffer.length,
      'text/plain',
      'other',
      'test',
      {},
      session.user.id
    );

    return NextResponse.json({ success: true, fileId, metadataId: metadata._id });
  } catch (error) {
    console.error('Test write error:', error);
    return NextResponse.json({ error: 'Test write failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

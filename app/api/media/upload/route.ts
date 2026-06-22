import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { uploadBufferToGridFS } from '@/lib/mediaGridFS';
import { uploadMediaWithMetadata } from '@/lib/mediaStorage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fileBase64, fileName, contentType, category, purpose, linkedTo } = body;

    if (!fileBase64 || !fileName) return NextResponse.json({ error: 'fileBase64 and fileName required' }, { status: 400 });

    // decode base64
    const buffer = Buffer.from(fileBase64, 'base64');

    // Upload binary to media GridFS
    const fileId = await uploadBufferToGridFS(buffer, fileName, contentType);

    // Create metadata in media DB
    await dbConnect();
    const metadata = await uploadMediaWithMetadata(
      fileId.toString(),
      fileName,
      buffer.length,
      contentType,
      category || 'other',
      purpose || 'other',
      linkedTo || {},
      session.user.id
    );

    return NextResponse.json({ success: true, fileId, metadataId: metadata._id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}

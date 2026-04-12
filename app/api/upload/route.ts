import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const contentType = file.type || '';
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);

    if (!isVideo && !isImage) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, GIF, WEBP, MP4, MOV, AVI, WEBM' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check file size based on type
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (buffer.length > maxSize) {
      const maxMB = isVideo ? 100 : 5;
      return NextResponse.json({ error: `File too large. Max ${maxMB}MB allowed` }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Get proper extension
    let ext = contentType.split('/').pop() || 'bin';
    if (ext === 'quicktime') ext = 'mov';
    if (ext === 'x-msvideo') ext = 'avi';
    if (ext === 'mp4' || ext === 'quicktime' || ext === 'x-msvideo' || ext === 'webm') {
      // Keep video extensions as is
    }
    
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    try {
      await fs.writeFile(filePath, buffer, { mode: 0o644 });
      const publicPath = `/uploads/${fileName}`;
      return NextResponse.json({ url: publicPath }, { status: 200 });
    } catch (writeError) {
      console.warn('Upload to public directory failed, falling back to data URL', writeError);
      const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ url: dataUrl }, { status: 200 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

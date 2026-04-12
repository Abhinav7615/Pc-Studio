import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const TMP_UPLOADS_DIR = path.join(os.tmpdir(), 'pc-studio-uploads');

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  webm: 'video/webm',
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '');
}

async function ensureDirectory(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch (err) {
    console.warn(`Could not create directory ${dir}`, err);
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const fileName = sanitizeFileName(url.searchParams.get('file') || '');

    if (!fileName) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    const safeFilePath = path.basename(fileName);
    const publicPath = path.join(process.cwd(), 'public', 'uploads', safeFilePath);
    const tmpPath = path.join(TMP_UPLOADS_DIR, safeFilePath);

    let filePath = publicPath;
    try {
      await fs.access(publicPath);
    } catch {
      filePath = tmpPath;
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const contentType = MIME_BY_EXTENSION[ext] || 'application/octet-stream';
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: { 'Content-Type': contentType },
      });
    } catch (readError) {
      console.error('Upload file serve error:', readError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Upload GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (buffer.length > maxSize) {
      const maxMB = isVideo ? 100 : 5;
      return NextResponse.json({ error: `File too large. Max ${maxMB}MB allowed` }, { status: 400 });
    }

    const ext = (() => {
      let fileExt = contentType.split('/').pop() || 'bin';
      if (fileExt === 'quicktime') fileExt = 'mov';
      if (fileExt === 'x-msvideo') fileExt = 'avi';
      return fileExt;
    })();

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const publicFilePath = path.join(publicUploadsDir, fileName);
    const tmpFilePath = path.join(TMP_UPLOADS_DIR, fileName);

    const publicReady = await ensureDirectory(publicUploadsDir);
    if (publicReady) {
      try {
        await fs.writeFile(publicFilePath, buffer, { mode: 0o644 });
        return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 200 });
      } catch (publicWriteError) {
        console.warn('Public upload write failed, falling back to temp storage', publicWriteError);
      }
    }

    const tmpReady = await ensureDirectory(TMP_UPLOADS_DIR);
    if (tmpReady) {
      try {
        await fs.writeFile(tmpFilePath, buffer, { mode: 0o644 });
        return NextResponse.json({ url: `/api/upload?file=${encodeURIComponent(fileName)}` }, { status: 200 });
      } catch (tmpWriteError) {
        console.warn('Temp upload write failed', tmpWriteError);
      }
    }

    return NextResponse.json({ error: 'Unable to save uploaded file on server' }, { status: 500 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

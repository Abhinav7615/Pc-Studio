import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

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

function getContentType(extension: string) {
  return MIME_BY_EXTENSION[extension.toLowerCase()] || 'application/octet-stream';
}

function getGridFSBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not initialized');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const fileName = sanitizeFileName(url.searchParams.get('file') || '');

    if (!fileName) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ filename: fileName }).toArray();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileDoc = files[0] as any;
    const downloadStream = bucket.openDownloadStreamByName(fileName);
    const chunks: Buffer[] = [];

    for await (const chunk of downloadStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const contentType = fileDoc.metadata?.contentType || getContentType(ext);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
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

    await dbConnect();

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
    const bucket = getGridFSBucket();

    await new Promise<void>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(fileName, {
        metadata: { originalName: file.name, contentType: contentType || getContentType(ext) },
      });

      uploadStream.on('error', (err) => reject(err));
      uploadStream.on('finish', () => resolve());
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: `/api/upload?file=${encodeURIComponent(fileName)}` }, { status: 200 });
  } catch (error) {
    console.error('Upload POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

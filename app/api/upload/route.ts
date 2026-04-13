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
    const files = await bucket
      .find({
        $or: [
          { filename: fileName },
          { 'metadata.originalName': fileName },
        ],
      })
      .toArray();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileDoc = files[0] as any;
    const downloadStream = bucket.openDownloadStream(fileDoc._id);
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

    const contentTypeHeader = request.headers.get('content-type') || '';
    const isMultipart = contentTypeHeader.startsWith('multipart/form-data');

    if (!isMultipart) {
      return NextResponse.json({ error: 'Upload must use multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded or invalid multipart form data' }, { status: 400 });
    }

    const uploadId = formData.get('uploadId')?.toString() || '';
    const chunkIndexRaw = formData.get('chunkIndex');
    const totalChunksRaw = formData.get('totalChunks');
    const chunkIndex = chunkIndexRaw !== null ? Number(chunkIndexRaw.toString()) : undefined;
    const totalChunks = totalChunksRaw !== null ? Number(totalChunksRaw.toString()) : undefined;
    const originalName = formData.get('originalName')?.toString() || file.name || '';

    const contentType = file.type || getContentType(path.extname(originalName).slice(1).toLowerCase());
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

    const bucket = getGridFSBucket();

    if (typeof chunkIndex === 'number' && !Number.isNaN(chunkIndex) && typeof totalChunks === 'number' && !Number.isNaN(totalChunks) && totalChunks > 1) {
      const chunkFileName = `${uploadId}-chunk-${chunkIndex}`;
      await new Promise<void>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(chunkFileName, {
          metadata: {
            originalName,
            contentType,
            uploadId,
            chunkIndex,
            totalChunks,
            isChunk: true,
          },
        });
        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => resolve());
        uploadStream.end(buffer);
      });

      if (chunkIndex < totalChunks - 1) {
        return NextResponse.json({ uploadId, chunkIndex, totalChunks, message: 'Chunk uploaded' }, { status: 200 });
      }

      const chunkFiles = await bucket
        .find({ 'metadata.uploadId': uploadId, 'metadata.isChunk': true })
        .sort({ 'metadata.chunkIndex': 1 })
        .toArray();

      if (!chunkFiles || chunkFiles.length !== totalChunks) {
        return NextResponse.json({ error: 'Uploaded chunks are missing or incomplete' }, { status: 400 });
      }

      const finalFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await new Promise<void>(async (resolve, reject) => {
        const uploadStream = bucket.openUploadStream(finalFileName, {
          metadata: { originalName, contentType, uploadId, isChunkedFile: true },
        });

        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => resolve());

        try {
          for (const chunkFile of chunkFiles) {
            const downloadStream = bucket.openDownloadStream(chunkFile._id);
            for await (const chunk of downloadStream) {
              uploadStream.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            await bucket.delete(chunkFile._id);
          }
          uploadStream.end();
        } catch (error) {
          reject(error);
        }
      });

      return NextResponse.json({ url: `/api/upload?file=${encodeURIComponent(finalFileName)}` }, { status: 200 });
    }

    const finalFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await new Promise<void>((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(finalFileName, {
        metadata: { originalName, contentType },
      });
      uploadStream.on('error', (err) => reject(err));
      uploadStream.on('finish', () => resolve());
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: `/api/upload?file=${encodeURIComponent(finalFileName)}` }, { status: 200 });
  } catch (error) {
    console.error('Upload POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

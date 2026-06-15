import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import path from 'path';

export const runtime = 'nodejs';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'video/mkv', 'video/3gpp', 'video/3gp'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

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
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  mpeg: 'audio/mpeg',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
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
      headers: { 
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable' // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Upload GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    const originalName = formData.get('originalName')?.toString() || file.name || '';
    const contentType = file.type || getContentType(path.extname(originalName).slice(1).toLowerCase());
    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);

    // Allow unauthenticated image uploads (for payment screenshots from customers)
    // But require authentication for videos/audio (admin uploads)
    const session = await getServerSession(authOptions);
    if (!session && !isImage) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadId = formData.get('uploadId')?.toString() || '';
    const chunkIndexRaw = formData.get('chunkIndex');
    const totalChunksRaw = formData.get('totalChunks');
    const chunkIndex = chunkIndexRaw !== null ? Number(chunkIndexRaw.toString()) : undefined;
    const totalChunks = totalChunksRaw !== null ? Number(totalChunksRaw.toString()) : undefined;

    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(contentType);

    if (!isVideo && !isImage && !isAudio) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, GIF, WEBP, MP4, MOV, AVI, WEBM, MKV, 3GP, WEBM audio, MP3, OGG, WAV' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    if (buffer.length > maxSize) {
      const maxMB = isVideo ? 100 : isAudio ? 25 : 5;
      return NextResponse.json({ error: `File too large. Max ${maxMB}MB allowed` }, { status: 400 });
    }

    const ext = (() => {
      let fileExt = contentType.split('/').pop() || 'bin';
      if (fileExt === 'quicktime') fileExt = 'mov';
      if (fileExt === 'x-msvideo') fileExt = 'avi';
      if (fileExt === 'mpeg') fileExt = 'mp3';
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

    const folder = formData.get('folder')?.toString() || undefined;
    const finalFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await new Promise<void>((resolve, reject) => {
      const metadata: Record<string, any> = { originalName, contentType };
      if (folder) metadata.folder = folder;
      const uploadStream = bucket.openUploadStream(finalFileName, {
        metadata,
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('DELETE request received');

    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'authenticated' : 'not authenticated');

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');

    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');
    console.log('File to delete:', fileName);

    if (!fileName) {
      console.log('Missing file parameter');
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    console.log('Getting GridFS bucket...');
    const bucket = getGridFSBucket();
    console.log('GridFS bucket obtained');

    console.log('Searching for files...');
    const files = await bucket
      .find({
        $or: [
          { filename: fileName },
          { 'metadata.originalName': fileName },
        ],
      })
      .toArray();

    console.log('Files found:', files.length);

    if (!files || files.length === 0) {
      console.log('File not found');
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete all matching files
    console.log('Deleting files...');
    for (const file of files) {
      console.log('Deleting file:', file._id);
      await bucket.delete(file._id);
    }

    console.log('File deletion successful');
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

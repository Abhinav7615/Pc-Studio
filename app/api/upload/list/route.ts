import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';

export const runtime = 'nodejs';

function getGridFSBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection is not initialized');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const bucket = getGridFSBucket();
    const url = new URL(request.url);
    const typeFilter = url.searchParams.get('type') || 'all';
    const folderFilter = url.searchParams.get('folder') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build query - exclude chunk files
    const query: any = {
      'metadata.isChunk': { $ne: true },
    };

    if (typeFilter === 'image') {
      query.contentType = { $regex: /^image/ };
    } else if (typeFilter === 'video') {
      query.contentType = { $regex: /^video/ };
    } else if (typeFilter === 'audio') {
      query.contentType = { $regex: /^audio/ };
    }

    if (folderFilter) {
      query['metadata.folder'] = folderFilter;
    }

    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { 'metadata.originalName': { $regex: search, $options: 'i' } },
      ];
    }

    const allFiles = await bucket.find(query).toArray();
    const fileIds = allFiles.map((file: any) => file._id.toString());
    const metadataRecords = fileIds.length
      ? await MediaMetadata.find({ fileId: { $in: fileIds } }).lean()
      : [];
    const metadataByFileId = metadataRecords.reduce((acc: Record<string, any>, item: any) => {
      acc[item.fileId?.toString?.()] = item;
      return acc;
    }, {});

    const visibleFiles = allFiles.filter((file: any) => {
      const metadata = metadataByFileId[file._id.toString()];
      return !metadata || metadata.status !== 'deleted';
    });

    const total = visibleFiles.length;
    const pagedFiles = visibleFiles.slice((page - 1) * limit, page * limit);

    const filesWithUrl = pagedFiles.map((file: any) => {
      const metadata = metadataByFileId[file._id.toString()];
      return {
        _id: file._id,
        filename: file.filename,
        length: file.length,
        contentType: file.contentType,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
        metadataId: metadata?._id?.toString?.(),
        url: `/api/upload?file=${encodeURIComponent(file.filename)}`,
      };
    });

    return NextResponse.json({
      files: filesWithUrl,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

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

    // Delete all matching files
    for (const file of files) {
      await bucket.delete(file._id);
    }

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
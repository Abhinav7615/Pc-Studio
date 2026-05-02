import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

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
    }

    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { 'metadata.originalName': { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count using find and count
    const allFiles = await bucket.find(query).toArray();
    const total = allFiles.length;
    
    const files = await bucket
      .find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const filesWithUrl = files.map((file: any) => ({
      _id: file._id,
      filename: file.filename,
      length: file.length,
      contentType: file.contentType,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/upload?file=${encodeURIComponent(file.filename)}`,
    }));

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
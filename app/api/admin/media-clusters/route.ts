import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mediaConnection, { connectMediaDb } from '@/lib/mongodbMedia';
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';
import { permanentlyDeleteMedia } from '@/lib/mediaStorage';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return null;
  }
  return session;
}

async function getBucketName(db: mongoose.mongo.Db) {
  const uploadsFiles = db.collection('uploads.files');
  const fsFiles = db.collection('fs.files');
  const uploadsCount = await uploadsFiles.countDocuments().catch(() => 0);
  const fsCount = await fsFiles.countDocuments().catch(() => 0);
  return fsCount > uploadsCount ? 'fs' : 'uploads';
}

async function getStorageStats(db: mongoose.mongo.Db, bucketName: string) {
  const filesColl = db.collection(`${bucketName}.files`);
  const chunksColl = db.collection(`${bucketName}.chunks`);

  const filesStats = await filesColl.aggregate([
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$length' },
        totalFiles: { $sum: 1 },
        avgSize: { $avg: '$length' }
      }
    }
  ]).toArray();

  const chunksStats = await chunksColl.aggregate([
    {
      $group: {
        _id: null,
        totalChunks: { $sum: 1 },
        totalChunkSize: { $sum: '$data' }
      }
    }
  ]).toArray();

  const typeBreakdown = await filesColl.aggregate([
    {
      $group: {
        _id: {
          type: {
            $cond: [
              { $regexMatch: { input: '$contentType', regex: '^image' } },
              'image',
              {
                $cond: [
                  { $regexMatch: { input: '$contentType', regex: '^video' } },
                  'video',
                  {
                    $cond: [
                      { $regexMatch: { input: '$contentType', regex: '^audio' } },
                      'audio',
                      'other'
                    ]
                  }
                ]
              }
            ]
          }
        },
        count: { $sum: 1 },
        size: { $sum: '$length' }
      }
    },
    { $sort: { size: -1 } }
  ]).toArray();

  const fileStats = filesStats[0] || { totalSize: 0, totalFiles: 0, avgSize: 0 };
  const chunkStats = chunksStats[0] || { totalChunks: 0, totalChunkSize: 0 };

  const fileIds = await chunksStats.length > 0
    ? (await chunksColl.aggregate([{ $group: { _id: '$files_id' } }]).toArray()).map((doc: any) => doc._id.toString())
    : [];
  const allChunks = await chunksColl.find({}).toArray();
  const orphanedCount = allChunks.filter((c: any) => !fileIds.includes(c.files_id?.toString?.())).length;

  const cutoff6h = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const incompleteUploads = await filesColl.countDocuments({ 'metadata.isChunk': true, uploadDate: { $lt: cutoff6h } });

  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const filesOlderThan90Days = await filesColl.countDocuments({ uploadDate: { $lt: cutoff90d }, 'metadata.isChunk': { $ne: true } });

  const totalSizeMB = (fileStats.totalSize / (1024 * 1024)) || 0;
  const usagePercent = totalSizeMB > 0 ? Math.min(100, (totalSizeMB / 512) * 100) : 0;

  return {
    status: usagePercent > 95 ? 'critical' : usagePercent > 80 ? 'warning' : 'ok',
    storage: {
      usedMB: Number(totalSizeMB.toFixed(2)),
      limitMB: 512,
      usagePercent: Number(usagePercent.toFixed(2)),
      totalFiles: fileStats.totalFiles,
      avgFileSizeMB: ((fileStats.avgSize || 0) / (1024 * 1024)).toFixed(2)
    },
    breakdown: {
      byType: typeBreakdown.map((item: any) => ({
        type: item._id.type,
        count: item.count,
        sizeMB: Number((item.size / (1024 * 1024)).toFixed(2))
      })),
      totalChunks: chunkStats.totalChunks || 0,
      orphanedChunks: orphanedCount,
      incompleteUploads,
      filesOlderThan90Days
    },
    cleanup: {
      canCleanupOrphaned: orphanedCount > 0,
      canCleanupIncomplete: incompleteUploads > 0,
      canCleanupOld: filesOlderThan90Days > 0,
      estimatedSpaceFreeable: 'Run cleanup scripts to estimate'
    },
    recommendations: usagePercent > 95 ? [
      '🚨 CRITICAL: Storage is almost full.',
      'Run emergency cleanup scripts or remove old files.',
      'Upgrade cluster tier if needed.'
    ] : usagePercent > 80 ? [
      '⚠️ WARNING: Storage is above 80%.',
      'Remove old or orphaned files soon.',
      'Consider upgrading cluster tier.'
    ] : []
  };
}

async function getPrimaryFiles(db: mongoose.mongo.Db) {
  const bucketName = 'uploads';
  const filesColl = db.collection(`${bucketName}.files`);
  const files = await filesColl.find({ 'metadata.isChunk': { $ne: true } })
    .sort({ uploadDate: -1 })
    .limit(200)
    .toArray();

  return files.map((file: any) => ({
    _id: file._id.toString(),
    filename: file.filename,
    length: file.length,
    contentType: file.contentType,
    uploadDate: file.uploadDate,
    metadata: file.metadata
  }));
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'status';

  try {
    await dbConnect();
    if (!mongoose.connection.db) {
      throw new Error('Primary MongoDB connection is not ready');
    }
    const primaryDb = mongoose.connection.db;
    
    // Handle media database connection safely
    let mediaDb: mongoose.mongo.Db | null = null;
    try {
      if (mediaConnection?.db) {
        mediaDb = mediaConnection.db;
      } else {
        // Try to establish media connection
        await connectMediaDb();
        mediaDb = mediaConnection?.db || null;
      }
    } catch (mediaErr) {
      console.warn('Media database connection failed, using primary as fallback:', mediaErr);
      mediaDb = null;
    }

    if (type === 'status') {
      try {
        const primaryStatus = await getStorageStats(primaryDb, 'uploads').catch(err => {
          console.error('Error getting primary status:', err);
          return null;
        });
        
        const mediaStatus = mediaDb 
          ? await getStorageStats(mediaDb, await getBucketName(mediaDb)).catch(err => {
              console.error('Error getting media status:', err);
              return null;
            })
          : null;

        return NextResponse.json({ 
          primaryStatus: primaryStatus || {
            status: 'unknown',
            storage: { usedMB: 0, limitMB: 512, usagePercent: 0, totalFiles: 0, avgFileSizeMB: '0.00' },
            breakdown: { byType: [], totalChunks: 0, orphanedChunks: 0, incompleteUploads: 0, filesOlderThan90Days: 0 },
            cleanup: { canCleanupOrphaned: false, canCleanupIncomplete: false, canCleanupOld: false, estimatedSpaceFreeable: 'N/A' },
            recommendations: ['Unable to retrieve statistics']
          },
          mediaStatus: mediaStatus || {
            status: 'unknown',
            storage: { usedMB: 0, limitMB: 512, usagePercent: 0, totalFiles: 0, avgFileSizeMB: '0.00' },
            breakdown: { byType: [], totalChunks: 0, orphanedChunks: 0, incompleteUploads: 0, filesOlderThan90Days: 0 },
            cleanup: { canCleanupOrphaned: false, canCleanupIncomplete: false, canCleanupOld: false, estimatedSpaceFreeable: 'N/A' },
            recommendations: ['Media database not available']
          }
        });
      } catch (statErr) {
        console.error('Error in status endpoint:', statErr);
        throw statErr;
      }
    }

    if (type === 'primary-files') {
      const files = await getPrimaryFiles(primaryDb);
      return NextResponse.json({ files });
    }

    if (type === 'metadata') {
      const items = await MediaMetadata.find().sort({ uploadedAt: -1 }).limit(200).lean();
      return NextResponse.json({ items: items.map((item: any) => ({
        _id: item._id.toString(),
        fileId: item.fileId?.toString?.() || '',
        fileName: item.fileName,
        fileSize: item.fileSize,
        contentType: item.contentType,
        category: item.category,
        purpose: item.purpose,
        status: item.status,
        uploadedAt: item.uploadedAt?.toISOString?.(),
        deletedAt: item.deletedAt?.toISOString?.(),
      })) });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Media clusters API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (!type) {
    return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    if (!mongoose.connection.db) {
      throw new Error('Primary MongoDB connection is not ready');
    }
    const primaryDb = mongoose.connection.db;

    if (type === 'primary-file') {
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return NextResponse.json({ error: 'filename is required' }, { status: 400 });
      }

      const bucket = new mongoose.mongo.GridFSBucket(primaryDb, { bucketName: 'uploads' });
      const files = await bucket.find({
        $or: [
          { filename },
          { 'metadata.originalName': filename }
        ]
      }).toArray();

      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      for (const file of files) {
        await bucket.delete(file._id);
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'media') {
      const metadataId = url.searchParams.get('metadataId');
      if (!metadataId) {
        return NextResponse.json({ error: 'metadataId is required' }, { status: 400 });
      }

      await permanentlyDeleteMedia(metadataId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid delete type' }, { status: 400 });
  } catch (error) {
    console.error('Media clusters delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

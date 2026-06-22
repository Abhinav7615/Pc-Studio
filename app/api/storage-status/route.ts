import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      console.error('storage-status: mongoose.connection.db is undefined');
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }
    const filesColl = db.collection('uploads.files');
    const chunksColl = db.collection('uploads.chunks');

    // Get storage stats
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
          totalChunkSize: { $sum: '$data' } // Approximate
        }
      }
    ]).toArray();

    const fileStats = filesStats[0] || { totalSize: 0, totalFiles: 0, avgSize: 0 };
    const chunkStats = chunksStats[0] || { totalChunks: 0 };

    // Get breakdown by type
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

    // Get orphaned chunks count
    const pipeline = [
      {
        $group: {
          _id: '$files_id'
        }
      }
    ];
    const fileIds = await chunksColl.aggregate(pipeline).toArray();
    const validFileIds = new Set(fileIds.map(doc => doc._id.toString()));
    
    const allChunks = await chunksColl.find({}).toArray();
    const orphanedCount = allChunks.filter(c => !validFileIds.has(c.files_id.toString())).length;

    // Get old files count
    const cutoff6h = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const oldChunkFiles = await filesColl.countDocuments({
      'metadata.isChunk': true,
      uploadDate: { $lt: cutoff6h }
    });

    const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const veryOldFiles = await filesColl.countDocuments({
      uploadDate: { $lt: cutoff90d },
      'metadata.isChunk': { $ne: true }
    });

    const totalSizeMB = (fileStats.totalSize / (1024 * 1024)).toFixed(2);
    const usagePercent = ((fileStats.totalSize / (512 * 1024 * 1024)) * 100).toFixed(2);
    
    // Alert threshold (>80% usage)
    const isAlert = parseFloat(usagePercent) > 80;
    const isCritical = parseFloat(usagePercent) > 95;

    return NextResponse.json({
      status: isCritical ? 'critical' : isAlert ? 'warning' : 'ok',
      storage: {
        usedMB: parseFloat(totalSizeMB),
        limitMB: 512,
        usagePercent: parseFloat(usagePercent),
        totalFiles: fileStats.totalFiles,
        avgFileSizeMB: (fileStats.avgSize / (1024 * 1024)).toFixed(2)
      },
      breakdown: {
        byType: typeBreakdown.map((t: any) => ({
          type: t._id.type,
          count: t.count,
          sizeMB: (t.size / (1024 * 1024)).toFixed(2)
        })),
        totalChunks: chunkStats.totalChunks,
        orphanedChunks: orphanedCount,
        incompleteUploads: oldChunkFiles,
        filesOlderThan90Days: veryOldFiles
      },
      cleanup: {
        canCleanupOrphaned: orphanedCount > 0,
        canCleanupIncomplete: oldChunkFiles > 0,
        canCleanupOld: veryOldFiles > 0,
        estimatedSpaceFreeable: 'Run emergency-cleanup.js to estimate'
      },
      recommendations: isCritical ? [
        '🚨 CRITICAL: Storage is 95%+ full. Uploads will fail soon.',
        'Run: node scripts/emergency-cleanup.js --aggressive',
        'Or upgrade cluster tier immediately'
      ] : isAlert ? [
        '⚠️ WARNING: Storage is 80%+ full.',
        'Run: node scripts/emergency-cleanup.js',
        'Consider upgrading cluster tier'
      ] : []
    });
  } catch (error) {
    console.error('Storage status error:', error);
    return NextResponse.json({ error: 'Failed to get storage status' }, { status: 500 });
  }
}

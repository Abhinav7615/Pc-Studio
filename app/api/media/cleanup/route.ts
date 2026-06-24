import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { getGridFSBucket } from '@/lib/mediaGridFS';
import MediaMetadata from '@/models/MediaMetadata';
import DeletedMedia from '@/models/DeletedMedia';
import { runDailyCleanup, runWeeklyCleanup, runMonthlyCleanup } from '@/lib/mediaCleanup';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // If client supplied files array => perform file cleanup (allowed for admin/staff)
    if (Array.isArray(body.files) && body.files.length > 0) {
      if (session.user.role !== 'admin' && session.user.role !== 'staff') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await dbConnect();
      const bucket = await getGridFSBucket({ bucketName: 'uploads' });

      for (const fileParam of body.files) {
        const fileName = String(fileParam).trim();
        if (!fileName) continue;

        const found = await bucket
          .find({ $or: [{ filename: fileName }, { 'metadata.originalName': fileName }] })
          .toArray();

        for (const fileDoc of found) {
          try {
            const metadata = await MediaMetadata.findOne({ fileId: fileDoc._id.toString() });
            if (metadata) {
              await metadata.remove();
              await DeletedMedia.create({
                originalMetadataId: metadata._id,
                fileId: fileDoc._id,
                fileName: fileDoc.metadata?.originalName || fileDoc.filename,
                fileSize: fileDoc.length,
                category: metadata.category || 'other',
                purpose: metadata.purpose || 'other',
                deletedBy: session.user.id,
                reason: 'cleanup',
                linkedObjects: metadata.linkedObjects || {},
                recoveryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              await bucket.delete(fileDoc._id);
            } else {
              await bucket.delete(fileDoc._id);
              try {
                await DeletedMedia.create({
                  originalMetadataId: null,
                  fileId: fileDoc._id,
                  fileName: fileDoc.metadata?.originalName || fileDoc.filename,
                  fileSize: fileDoc.length,
                  category: 'other',
                  purpose: 'other',
                  deletedBy: session.user.id,
                  reason: 'cleanup',
                  linkedObjects: {},
                  recoveryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  metadata: { filename: fileDoc.filename, gridFsMetadata: fileDoc.metadata },
                });
              } catch (err) {
                console.error('Failed to record deleted media during cleanup:', err);
              }
            }
          } catch (err) {
            console.error('Error deleting file during cleanup:', err);
          }
        }
      }

      return NextResponse.json({ message: 'Cleanup attempted' });
    }

    // If request contains a 'type' field => run scheduled/manual cleanup (admin only)
    const type = typeof body.type === 'string' ? body.type : null;
    if (type) {
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (type === 'daily') await runDailyCleanup();
      else if (type === 'weekly') await runWeeklyCleanup();
      else if (type === 'monthly') await runMonthlyCleanup();
      else await runDailyCleanup();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'No action taken' });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

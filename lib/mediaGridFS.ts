import { Readable } from 'stream';
import { Db, GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import mediaConnection, { connectMediaDb } from '@/lib/mongodbMedia';

async function getDb(): Promise<Db> {
  // Try to use the media connection when available. If it is not created yet,
  // attempt to establish it (connectMediaDb) when a media URI is configured.
  if (mediaConnection) {
    if ((mediaConnection as any).db) return (mediaConnection as any).db;
    await connectMediaDb();
    if ((mediaConnection as any).db) return (mediaConnection as any).db;
  } else {
    // No mediaConnection instance yet — try to establish one if a media URI exists.
    try {
      await connectMediaDb();
      if ((mediaConnection as any)?.db) return (mediaConnection as any).db;
    } catch (e) {
      // fallthrough to primary DB fallback
      // keep the error silent here — callers will receive a clear error if primary is also unavailable
      console.warn('Media DB connect attempt failed or not configured, falling back to primary DB:', (e as any)?.message || e);
    }
  }

  // Fallback: use primary mongoose connection if available
  if (mongoose.connection?.db) return mongoose.connection.db;

  // If media connection is not available and primary is not ready, but MONGODB_URI exists,
  // the primary connection may be in progress — throw descriptive error.
  throw new Error('No MongoDB connection available for GridFS');
}

export async function getGridFSBucket(options?: { bucketName?: string }) {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: options?.bucketName ?? 'uploads' });
}

export async function uploadBufferToGridFS(buffer: Buffer, filename: string, contentType?: string) {
  const bucket = await getGridFSBucket();
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);

  return new Promise<mongoose.Types.ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: contentType ? { contentType } : undefined
    });
    readable.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve(uploadStream.id as mongoose.Types.ObjectId);
      });
  });
}

export async function deleteFromGridFS(id: string | mongoose.Types.ObjectId) {
  const bucket = await getGridFSBucket();
  const oid = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return bucket.delete(oid);
}

const mediaGridFS = {
  getGridFSBucket,
  uploadBufferToGridFS,
  deleteFromGridFS
};

export default mediaGridFS;

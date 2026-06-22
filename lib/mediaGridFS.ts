import { Readable } from 'stream';
import { Db, GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';

function getDb(): Db {
  if (mediaConnection?.db) return mediaConnection.db;
  if (mongoose.connection?.db) return mongoose.connection.db;
  throw new Error('No MongoDB connection available for GridFS');
}

export function getGridFSBucket(options?: { bucketName?: string }) {
  const db = getDb();
  return new GridFSBucket(db, { bucketName: options?.bucketName ?? 'fs' });
}

export async function uploadBufferToGridFS(buffer: Buffer, filename: string, contentType?: string) {
  const bucket = getGridFSBucket();
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
  const bucket = getGridFSBucket();
  const oid = typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  return bucket.delete(oid);
}

const mediaGridFS = {
  getGridFSBucket,
  uploadBufferToGridFS,
  deleteFromGridFS
};

export default mediaGridFS;

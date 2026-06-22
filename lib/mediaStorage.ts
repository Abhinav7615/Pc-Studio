import type { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';
import DeletedMedia from '@/models/DeletedMedia';
import mediaConnection from '@/lib/mongodbMedia';

type MediaLinkContext = {
  productId?: string;
  orderId?: string;
  userId?: string;
  ticketId?: string;
  paymentId?: string;
};

export async function uploadMediaWithMetadata(
  fileId: string,
  fileName: string,
  fileSize: number,
  contentType: string,
  category: string,
  purpose: string,
  linkedTo: MediaLinkContext,
  userId: string
) {
  const metadata = await MediaMetadata.create({
    fileId,
    fileName,
    fileSize,
    contentType,
    category,
    purpose,
    linkedToProduct: linkedTo.productId,
    linkedToOrder: linkedTo.orderId,
    linkedToUser: linkedTo.userId || userId,
    linkedToTicket: linkedTo.ticketId,
    linkedToPayment: linkedTo.paymentId,
    uploadedBy: userId,
    uploadedAt: new Date()
  });

  return metadata;
}

export async function softDeleteMedia(
  metadataId: string,
  userId: string,
  reason: string = 'manual'
) {
  const metadata = await MediaMetadata.findById(metadataId);

  if (!metadata) throw new Error('Media not found');

  await MediaMetadata.updateOne(
    { _id: metadataId },
    {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: userId,
      inRecycleBin: true,
      recycleBinAddedAt: new Date(),
      recycleBinExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  );

  await DeletedMedia.create({
    originalMetadataId: metadataId,
    fileId: metadata.fileId,
    fileName: metadata.fileName,
    fileSize: metadata.fileSize,
    category: metadata.category,
    purpose: metadata.purpose,
    deletedBy: userId,
    reason,
    linkedObjects: {
      productId: metadata.linkedToProduct,
      orderId: metadata.linkedToOrder,
      userId: metadata.linkedToUser,
      ticketId: metadata.linkedToTicket
    },
    recoveryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    metadata
  });

  return { success: true, recoveryDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
}

export async function recoverMedia(metadataId: string) {
  const metadata = await MediaMetadata.findById(metadataId);
  if (!metadata) throw new Error('Media not found');

  await MediaMetadata.updateOne(
    { _id: metadataId },
    {
      status: 'active',
      deletedAt: null,
      deletedBy: null,
      inRecycleBin: false,
      recycleBinAddedAt: null,
      recycleBinExpiresAt: null
    }
  );

  await DeletedMedia.updateOne(
    { originalMetadataId: metadataId },
    { recoveredAt: new Date() }
  );

  return { success: true };
}

export async function permanentlyDeleteMedia(
  id: string,
  mode: 'metadata' | 'deleted' = 'metadata',
  gridFsBucket?: GridFSBucket
) {
  if (mode === 'deleted') {
    const deletedItem = await DeletedMedia.findById(id);
    if (!deletedItem) throw new Error('Deleted item not found');

    const fileObjectId = deletedItem.fileId && typeof deletedItem.fileId === 'string'
      ? new mongoose.Types.ObjectId(deletedItem.fileId)
      : deletedItem.fileId;

    if (fileObjectId) {
      const connection = mediaConnection?.db ? mediaConnection : mongoose.connection;
      const db = connection.db;
      if (gridFsBucket) {
        await gridFsBucket.delete(fileObjectId);
      } else if (db) {
        const bucket = new (await import('mongodb')).GridFSBucket(db);
        await bucket.delete(fileObjectId);
      }
    }

    if (deletedItem.originalMetadataId) {
      await MediaMetadata.deleteOne({ _id: deletedItem.originalMetadataId });
    }

    await DeletedMedia.updateOne(
      { _id: id },
      { permanentlyDeletedAt: new Date() }
    );

    return { success: true, spaceFreed: deletedItem.fileSize ?? 0 };
  }

  const metadata = await MediaMetadata.findById(id);
  if (!metadata) throw new Error('Media not found');

  try {
    const connection = mediaConnection?.db ? mediaConnection : mongoose.connection;
    const db = connection.db;

    if (metadata.fileId) {
      const fileObjectId = typeof metadata.fileId === 'string'
        ? new mongoose.Types.ObjectId(metadata.fileId)
        : metadata.fileId;

      if (gridFsBucket) {
        await gridFsBucket.delete(fileObjectId);
      } else if (db) {
        const bucket = new (await import('mongodb')).GridFSBucket(db);
        await bucket.delete(fileObjectId);
      }
    }

    await MediaMetadata.deleteOne({ _id: id });

    await DeletedMedia.updateOne(
      { originalMetadataId: id },
      { permanentlyDeletedAt: new Date() }
    );

    return { success: true, spaceFreed: metadata.fileSize ?? 0 };
  } catch (error) {
    console.error('Error permanently deleting media:', error);
    throw error;
  }
}

const mediaStorage = {
  uploadMediaWithMetadata,
  softDeleteMedia,
  recoverMedia,
  permanentlyDeleteMedia
};

export default mediaStorage;

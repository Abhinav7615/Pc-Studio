# 🚀 Quick Start Implementation Guide

## Database Models Setup

### 1. MediaMetadata Model

```typescript
// models/MediaMetadata.ts
import mongoose, { Schema } from 'mongoose';

const mediaMetadataSchema = new Schema({
  fileId: mongoose.Types.ObjectId,
  fileName: String,
  fileSize: Number,
  contentType: String,
  
  // Category & Purpose
  category: {
    type: String,
    enum: ['product', 'payment', 'order', 'support', 'user_profile', 'other'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['product_image', 'product_video', 'payment_screenshot', 'payment_receipt', 
           'invoice', 'proof_of_delivery', 'support_attachment', 'identity_proof', 'other'],
    required: true
  },
  
  // Links
  linkedToProduct: mongoose.Types.ObjectId,
  linkedToOrder: mongoose.Types.ObjectId,
  linkedToUser: mongoose.Types.ObjectId,
  linkedToTicket: mongoose.Types.ObjectId,
  linkedToPayment: mongoose.Types.ObjectId,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  },
  
  uploadedBy: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: Date,
  
  // Deletion
  deletedAt: Date,
  deletedBy: mongoose.Types.ObjectId,
  permanentlyDeletedAt: Date,
  
  // Recycle Bin
  inRecycleBin: {
    type: Boolean,
    default: false
  },
  recycleBinAddedAt: Date,
  recycleBinExpiresAt: Date,
  
  // Metadata
  tags: [String],
  expiryDate: Date,
  isTemporary: Boolean,
  accessCount: {
    type: Number,
    default: 0
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
mediaMetadataSchema.index({ status: 1 });
mediaMetadataSchema.index({ category: 1, purpose: 1 });
mediaMetadataSchema.index({ linkedToProduct: 1 });
mediaMetadataSchema.index({ linkedToOrder: 1 });
mediaMetadataSchema.index({ uploadedAt: -1 });
mediaMetadataSchema.index({ recycleBinExpiresAt: 1 });
mediaMetadataSchema.index({ expiryDate: 1 });

export default mongoose.models.MediaMetadata || 
  mongoose.model('MediaMetadata', mediaMetadataSchema);
```

### 2. DeletedMedia Model (Recycle Bin)

```typescript
// models/DeletedMedia.ts
import mongoose, { Schema } from 'mongoose';

const deletedMediaSchema = new Schema({
  originalMetadataId: mongoose.Types.ObjectId,
  fileId: mongoose.Types.ObjectId,
  fileName: String,
  fileSize: Number,
  category: String,
  purpose: String,
  
  deletedAt: {
    type: Date,
    default: Date.now
  },
  deletedBy: mongoose.Types.ObjectId,
  reason: {
    type: String,
    enum: ['manual', 'auto_cleanup', 'user_request', 'order_complete'],
    required: true
  },
  
  linkedObjects: {
    productId: mongoose.Types.ObjectId,
    orderId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    ticketId: mongoose.Types.ObjectId
  },
  
  recoveryDeadline: Date,
  metadata: Schema.Types.Mixed
}, { timestamps: true });

deletedMediaSchema.index({ recoveryDeadline: 1 });
deletedMediaSchema.index({ deletedAt: -1 });
deletedMediaSchema.index({ originalMetadataId: 1 });

export default mongoose.models.DeletedMedia || 
  mongoose.model('DeletedMedia', deletedMediaSchema);
```

### 3. CleanupLog Model

```typescript
// models/CleanupLog.ts
import mongoose, { Schema } from 'mongoose';

const cleanupLogSchema = new Schema({
  cleanupType: {
    type: String,
    enum: ['automatic', 'manual', 'scheduled'],
    required: true
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  executedBy: mongoose.Types.ObjectId,
  
  filesDeleted: Number,
  spaceFreed: Number,
  spaceFreedMB: Number,
  
  deletionReason: String,
  deletedMediaIds: [mongoose.Types.ObjectId],
  
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  errorLog: String,
  
  storageStatusBefore: {
    usedMB: Number,
    usagePercent: Number
  },
  storageStatusAfter: {
    usedMB: Number,
    usagePercent: Number
  }
}, { timestamps: true });

cleanupLogSchema.index({ executedAt: -1 });
cleanupLogSchema.index({ cleanupType: 1 });
cleanupLogSchema.index({ status: 1 });

export default mongoose.models.CleanupLog || 
  mongoose.model('CleanupLog', cleanupLogSchema);
```

---

## Core Functions

### Media Operations (lib/mediaStorage.ts)

```typescript
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';
import DeletedMedia from '@/models/DeletedMedia';

// Upload with metadata
export async function uploadMediaWithMetadata(
  fileId: string,
  fileName: string,
  fileSize: number,
  contentType: string,
  category: string,
  purpose: string,
  linkedTo: any,
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

// Soft delete
export async function softDeleteMedia(
  metadataId: string,
  userId: string,
  reason: string = 'manual'
) {
  const metadata = await MediaMetadata.findById(metadataId);
  
  if (!metadata) throw new Error('Media not found');
  
  // Move to recycle bin
  await MediaMetadata.updateOne(
    { _id: metadataId },
    {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: userId,
      inRecycleBin: true,
      recycleBinAddedAt: new Date(),
      recycleBinExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  );
  
  // Create deletion record
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

// Recover from recycle bin
export async function recoverMedia(metadataId: string) {
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
  
  return { success: true };
}

// Permanently delete
export async function permanentlyDeleteMedia(
  metadataId: string,
  gridFsBucket: any
) {
  const metadata = await MediaMetadata.findById(metadataId);
  
  if (!metadata) throw new Error('Media not found');
  
  try {
    // Delete from GridFS
    await gridFsBucket.delete(new mongoose.Types.ObjectId(metadata.fileId));
    
    // Delete metadata
    await MediaMetadata.deleteOne({ _id: metadataId });
    
    // Update DeletedMedia
    await DeletedMedia.updateOne(
      { originalMetadataId: metadataId },
      { permanentlyDeletedAt: new Date() }
    );
    
    return { success: true, spaceFreed: metadata.fileSize };
  } catch (error) {
    console.error('Error permanently deleting media:', error);
    throw error;
  }
}
```

---

## API Endpoints Examples

### Soft Delete

```typescript
// app/api/media/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { softDeleteMedia } from '@/lib/mediaStorage';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { fileId, reason } = await req.json();
    
    await dbConnect();
    
    const result = await softDeleteMedia(fileId, session.user.id, reason);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
```

### Get Recycle Bin

```typescript
// app/api/media/recycle-bin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DeletedMedia from '@/models/DeletedMedia';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;
    
    const deleted = await DeletedMedia
      .find()
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await DeletedMedia.countDocuments();
    
    return NextResponse.json({
      data: deleted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycle bin' },
      { status: 500 }
    );
  }
}
```

---

## Cleanup Scheduling (lib/mediaCleanup.ts)

```typescript
import cron from 'node-cron';
import MediaMetadata from '@/models/MediaMetadata';
import CleanupLog from '@/models/CleanupLog';
import dbConnect from '@/lib/mongodb';

export function scheduleCleanupJobs() {
  // Daily cleanup at 2 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily cleanup...');
    await runDailyCleanup();
  });
  
  // Weekly deep cleanup on Sunday at 3 AM UTC
  cron.schedule('0 3 * * 0', async () => {
    console.log('Running weekly cleanup...');
    await runWeeklyCleanup();
  });
  
  // Monthly audit on 1st at 4 AM UTC
  cron.schedule('0 4 1 * *', async () => {
    console.log('Running monthly cleanup...');
    await runMonthlyCleanup();
  });
}

async function runDailyCleanup() {
  try {
    await dbConnect();
    
    const now = new Date();
    const startTime = Date.now();
    
    // Delete RecycleBin items older than 30 days
    const permanentDelete = await MediaMetadata.deleteMany({
      inRecycleBin: true,
      recycleBinExpiresAt: { $lt: now }
    });
    
    // Move expired files to recycle bin
    const expiredCount = await MediaMetadata.updateMany(
      {
        expiryDate: { $lt: now },
        status: 'active'
      },
      {
        status: 'deleted',
        inRecycleBin: true,
        deletedAt: now,
        recycleBinExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      }
    );
    
    await CleanupLog.create({
      cleanupType: 'automatic',
      executedBy: 'system',
      filesDeleted: permanentDelete.deletedCount,
      spaceFreed: permanentDelete.deletedCount * 1024 * 1024, // estimate
      deletionReason: 'daily_recycle_bin_cleanup',
      status: 'success'
    });
    
    console.log(`Daily cleanup completed: ${permanentDelete.deletedCount} files deleted`);
  } catch (error) {
    console.error('Daily cleanup error:', error);
  }
}

async function runWeeklyCleanup() {
  // Cleanup old payment screenshots, duplicate files, etc.
  try {
    await dbConnect();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Delete old payment screenshots
    const result = await MediaMetadata.updateMany(
      {
        purpose: 'payment_screenshot',
        uploadedAt: { $lt: ninetyDaysAgo },
        status: 'active'
      },
      {
        status: 'deleted',
        inRecycleBin: true,
        deletedAt: now,
        recycleBinExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      }
    );
    
    await CleanupLog.create({
      cleanupType: 'automatic',
      executedBy: 'system',
      filesDeleted: result.modifiedCount,
      deletionReason: 'weekly_payment_screenshot_cleanup',
      status: 'success'
    });
  } catch (error) {
    console.error('Weekly cleanup error:', error);
  }
}

async function runMonthlyCleanup() {
  // Full audit, old support tickets, inactive users
  try {
    await dbConnect();
    const now = new Date();
    
    // Add comprehensive cleanup logic here
    
    console.log('Monthly cleanup completed');
  } catch (error) {
    console.error('Monthly cleanup error:', error);
  }
}
```

---

## Environment Variables

```env
# .env.local

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/pc-studio
MONGODB_MEDIA_URI=mongodb+srv://user:pass@cluster1.mongodb.net/pc-studio-media

# Cleanup Settings
CLEANUP_PAYMENT_SCREENSHOT_RETENTION_DAYS=90
CLEANUP_ORDER_DOCUMENT_RETENTION_DAYS=30
CLEANUP_SUPPORT_TICKET_RETENTION_DAYS=60
CLEANUP_INACTIVE_USER_RETENTION_DAYS=365
CLEANUP_RECYCLE_BIN_RETENTION_DAYS=30

# Cleanup Scheduling
ENABLE_AUTO_CLEANUP=true
CLEANUP_RUN_TIME=02:00
CLEANUP_TIMEZONE=UTC
```

---

## Testing

```typescript
// __tests__/mediaCleanup.test.ts
import { softDeleteMedia, recoverMedia } from '@/lib/mediaStorage';

describe('Media Cleanup', () => {
  it('should soft delete media', async () => {
    const result = await softDeleteMedia('metadataId', 'userId', 'manual');
    expect(result.success).toBe(true);
  });
  
  it('should recover deleted media', async () => {
    const result = await recoverMedia('metadataId');
    expect(result.success).toBe(true);
  });
});
```

---

**अब implementation शुरू करने के लिए तैयार हो!** 🚀

क्या तुम चाहते हो कि मैं:
1. **सभी models create कर दूँ?**
2. **API endpoints implement कर दूँ?**
3. **Admin components बना दूँ?**
4. **Cleanup scheduling setup कर दूँ?**

कहो! 👊

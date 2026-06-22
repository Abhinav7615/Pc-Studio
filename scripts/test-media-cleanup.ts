import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';
import DeletedMedia from '@/models/DeletedMedia';
import CleanupLog from '@/models/CleanupLog';
import { runDailyCleanup } from '@/lib/mediaCleanup';

async function runTest() {
  // Start an explicit in-memory MongoDB and connect mongoose directly
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: 'test' });

  // Clean previous test data
  await Promise.all([
    MediaMetadata.deleteMany({}),
    DeletedMedia.deleteMany({}),
    CleanupLog.deleteMany({})
  ]);

  const now = new Date();

  // Item already in recycle bin and expired
  await MediaMetadata.create({
    fileId: new mongoose.Types.ObjectId(),
    fileName: 'old-in-bin.jpg',
    fileSize: 1024,
    contentType: 'image/jpeg',
    category: 'product',
    purpose: 'product_image',
    uploadedBy: new mongoose.Types.ObjectId(),
    status: 'deleted',
    inRecycleBin: true,
    recycleBinAddedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
    recycleBinExpiresAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
  });

  // Active item but expired via expiryDate
  await MediaMetadata.create({
    fileId: new mongoose.Types.ObjectId(),
    fileName: 'expired-active.jpg',
    fileSize: 2048,
    contentType: 'image/jpeg',
    category: 'payment',
    purpose: 'payment_screenshot',
    uploadedBy: new mongoose.Types.ObjectId(),
    status: 'active',
    expiryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  });

  // Recent active item should remain
  await MediaMetadata.create({
    fileId: new mongoose.Types.ObjectId(),
    fileName: 'recent.jpg',
    fileSize: 512,
    contentType: 'image/jpeg',
    category: 'product',
    purpose: 'product_image',
    uploadedBy: new mongoose.Types.ObjectId(),
    status: 'active'
  });

  const beforeCount = await MediaMetadata.countDocuments();
  console.log('Before cleanup - MediaMetadata count:', beforeCount);

  await runDailyCleanup();

  const afterCount = await MediaMetadata.countDocuments();
  const deletedCount = await DeletedMedia.countDocuments();
  const logs = await CleanupLog.find().sort({ executedAt: -1 }).limit(5);

  console.log('After cleanup - MediaMetadata count:', afterCount);
  console.log('DeletedMedia count:', deletedCount);
  console.log('Cleanup logs:', logs.map(l => ({ type: l.cleanupType, filesDeleted: l.filesDeleted })));

  process.exit(0);
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

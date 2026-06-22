import cron from 'node-cron';
import mongoose from 'mongoose';
import MediaMetadata from '@/models/MediaMetadata';
import CleanupLog from '@/models/CleanupLog';
import dbConnect from '@/lib/mongodb';

export function scheduleCleanupJobs() {
  if (process.env.ENABLE_AUTO_CLEANUP === 'false') return;

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

export async function runDailyCleanup() {
  try {
    if (mongoose.connection.readyState === 0) await dbConnect();

    const now = new Date();

    const permanentDelete = await MediaMetadata.deleteMany({
      inRecycleBin: true,
      recycleBinExpiresAt: { $lt: now }
    });

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
      filesDeleted: permanentDelete.deletedCount || 0,
      spaceFreed: (permanentDelete.deletedCount || 0) * 1024 * 1024,
      deletionReason: 'daily_recycle_bin_cleanup',
      status: 'success'
    });

    console.log(`Daily cleanup completed: ${permanentDelete.deletedCount} files deleted`);
  } catch (error) {
    console.error('Daily cleanup error:', error);
  }
}

export async function runWeeklyCleanup() {
  try {
    if (mongoose.connection.readyState === 0) await dbConnect();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

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
      filesDeleted: (result as any).modifiedCount || 0,
      deletionReason: 'weekly_payment_screenshot_cleanup',
      status: 'success'
    });
  } catch (error) {
    console.error('Weekly cleanup error:', error);
  }
}

export async function runMonthlyCleanup() {
  try {
    if (mongoose.connection.readyState === 0) await dbConnect();
    // Placeholder for monthly audit logic
    console.log('Monthly cleanup completed');
  } catch (error) {
    console.error('Monthly cleanup error:', error);
  }
}

export default {
  scheduleCleanupJobs,
  runDailyCleanup,
  runWeeklyCleanup,
  runMonthlyCleanup
};

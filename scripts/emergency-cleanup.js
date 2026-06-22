#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Emergency storage cleanup script
 * Removes orphaned chunks, incomplete uploads, and old temporary files
 * Usage: node scripts/emergency-cleanup.js [--aggressive] [--dry-run]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const args = require('minimist')(process.argv.slice(2));
const aggressive = !!args.aggressive;
const dryRun = !!args['dry-run'];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    console.log('\n🧹 Emergency Storage Cleanup Started\n');
    
    // 1. Delete orphaned chunk files (chunks without corresponding file entries)
    console.log('1️⃣ Cleaning orphaned chunks...');
    const chunksColl = db.collection('uploads.chunks');
    const filesColl = db.collection('uploads.files');
    
    const chunkCount = await chunksColl.countDocuments();
    console.log(`   Total chunks in DB: ${chunkCount}`);
    
    const pipeline = [
      {
        $group: {
          _id: '$files_id'
        }
      },
      {
        $project: {
          _id: 1
        }
      }
    ];
    
    const fileIds = await chunksColl.aggregate(pipeline).toArray();
    const validFileIds = fileIds.map(doc => doc._id);
    
    const orphanedChunks = await chunksColl
      .find({ files_id: { $nin: validFileIds } })
      .toArray();
    
    console.log(`   Found ${orphanedChunks.length} orphaned chunks`);
    if (orphanedChunks.length > 0 && !dryRun) {
      const result = await chunksColl.deleteMany({ 
        files_id: { $nin: validFileIds } 
      });
      console.log(`   ✅ Deleted ${result.deletedCount} orphaned chunks`);
    }
    
    // 2. Delete incomplete chunk files (files marked as chunks that are old)
    console.log('\n2️⃣ Cleaning incomplete uploads...');
    const incompleteChunks = await filesColl
      .find({ 
        'metadata.isChunk': true,
        uploadDate: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) } // older than 6 hours
      })
      .toArray();
    
    console.log(`   Found ${incompleteChunks.length} old chunk files`);
    if (incompleteChunks.length > 0 && !dryRun) {
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
      for (const chunk of incompleteChunks) {
        try {
          await bucket.delete(chunk._id);
        } catch (err) {
          console.error(`   ⚠️ Failed to delete ${chunk._id}: ${err.message}`);
        }
      }
      console.log(`   ✅ Deleted ${incompleteChunks.length} incomplete uploads`);
    }
    
    // 3. Optional: Aggressive cleanup - delete very old files
    if (aggressive) {
      console.log('\n3️⃣ Aggressive cleanup: Removing files older than 90 days...');
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const oldFiles = await filesColl
        .find({ uploadDate: { $lt: cutoff } })
        .toArray();
      
      console.log(`   Found ${oldFiles.length} files older than 90 days`);
      if (oldFiles.length > 0 && !dryRun) {
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
        for (const file of oldFiles) {
          try {
            await bucket.delete(file._id);
          } catch (err) {
            console.error(`   ⚠️ Failed to delete ${file._id}: ${err.message}`);
          }
        }
        console.log(`   ✅ Deleted ${oldFiles.length} old files`);
      }
    }
    
    // 4. Report final status
    console.log('\n📊 Final Storage Report:');
    const finalStats = await filesColl.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$length' }, totalFiles: { $sum: 1 } } }
    ]).toArray();
    
    if (finalStats.length > 0) {
      const stats = finalStats[0];
      const sizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      console.log(`   Total files: ${stats.totalFiles}`);
      console.log(`   Total size: ${sizeMB} MB`);
    }
    
    if (dryRun) {
      console.log('\n⚠️ DRY RUN MODE - No files were deleted. Run without --dry-run to execute cleanup.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();

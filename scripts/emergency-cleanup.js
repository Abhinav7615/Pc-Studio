#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Emergency storage cleanup script
 * Removes orphaned chunks, incomplete uploads, and old temporary files
 * Usage: node scripts/emergency-cleanup.js [--aggressive] [--dry-run] [--cluster=primary|media|both]
 */

const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const args = require('minimist')(process.argv.slice(2));
const aggressive = !!args.aggressive;
const dryRun = !!args['dry-run'];
const clusterArg = (args.cluster || args.c || 'primary').toString().toLowerCase();
const clusters = clusterArg === 'both' ? ['primary', 'media'] : [clusterArg];

async function cleanupCluster(clusterName, uri) {
  if (!uri) {
    console.warn(`Skipping ${clusterName} cleanup because URI is not configured.`);
    return { deletedChunks: 0, deletedFiles: 0, oldFilesDeleted: 0 };
  }

  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  const db = mongoose.connection.db;
  console.log(`\n🧹 Running cleanup for ${clusterName} cluster`);
  console.log(`MongoDB URI: ${uri.replace(/(mongodb\+srv:\/\/[^:]+):.+@/, '$1:****@')}`);

  const chunksColl = db.collection('uploads.chunks');
  const filesColl = db.collection('uploads.files');

  const chunkCount = await chunksColl.countDocuments();
  console.log(`   Total chunks in DB: ${chunkCount}`);

  const fileIds = await chunksColl.aggregate([
    { $group: { _id: '$files_id' } },
    { $project: { _id: 1 } }
  ]).toArray();
  const validFileIds = fileIds.map(doc => doc._id);

  const orphanedChunks = await chunksColl
    .find({ files_id: { $nin: validFileIds } })
    .toArray();

  console.log(`   Found ${orphanedChunks.length} orphaned chunks`);
  if (orphanedChunks.length > 0 && !dryRun) {
    const result = await chunksColl.deleteMany({ files_id: { $nin: validFileIds } });
    console.log(`   ✅ Deleted ${result.deletedCount} orphaned chunks`);
  }

  console.log('\n2️⃣ Cleaning incomplete uploads...');
  const incompleteChunks = await filesColl
    .find({
      'metadata.isChunk': true,
      uploadDate: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
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

  let oldFilesDeleted = 0;
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
          oldFilesDeleted += 1;
        } catch (err) {
          console.error(`   ⚠️ Failed to delete ${file._id}: ${err.message}`);
        }
      }
      console.log(`   ✅ Deleted ${oldFiles.length} old files`);
    }
  }

  const finalStats = await filesColl.aggregate([
    { $group: { _id: null, totalSize: { $sum: '$length' }, totalFiles: { $sum: 1 } } }
  ]).toArray();

  if (finalStats.length > 0) {
    const stats = finalStats[0];
    const sizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
    console.log(`\n📊 ${clusterName} report: ${stats.totalFiles} files, ${sizeMB} MB`);
  }

  await mongoose.disconnect();
  return {
    deletedChunks: orphanedChunks.length,
    deletedFiles: incompleteChunks.length,
    oldFilesDeleted
  };
}

async function main() {
  const cleanupResults = [];

  for (const clusterName of clusters) {
    const uri = clusterName === 'media' ? process.env.MONGODB_MEDIA_URI : process.env.MONGODB_URI;
    try {
      const result = await cleanupCluster(clusterName, uri);
      cleanupResults.push({ clusterName, result });
    } catch (error) {
      console.error(`\n❌ ${clusterName} cleanup failed:`, error.message || error);
    }
  }

  if (cleanupResults.length === 0) {
    console.error('\n❌ No clusters were cleaned. Please verify your MONGODB_URI or MONGODB_MEDIA_URI settings.');
    process.exit(1);
  }

  console.log('\n✅ Cleanup completed. Review logs above for details.');
}

main();

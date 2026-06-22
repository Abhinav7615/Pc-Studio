#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Safe Monthly Cleanup - Delete only out-of-stock product media
 * This script removes image/video media files ONLY from out-of-stock products
 * In-stock products' media is never touched
 * 
 * Usage: node scripts/safe-cleanup-outofstock.js [--dry-run]
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const args = require('minimist')(process.argv.slice(2));
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
    const productsColl = db.collection('products');
    const filesColl = db.collection('uploads.files');
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

    console.log('\n🧹 Safe Monthly Cleanup - Out-of-Stock Products Only\n');

    // Step 1: Find all out-of-stock products
    console.log('1️⃣ Finding out-of-stock products...');
    const outOfStockProducts = await productsColl
      .find({ status: 'out-of-stock' })
      .project({ _id: 1, name: 1, images: 1, videos: 1, 'variants.images': 1 })
      .toArray();

    console.log(`   Found ${outOfStockProducts.length} out-of-stock products`);

    if (outOfStockProducts.length === 0) {
      console.log('   ✅ No out-of-stock products - nothing to delete');
      await mongoose.disconnect();
      return;
    }

    // Step 2: Collect all media URLs from out-of-stock products
    console.log('\n2️⃣ Collecting media files from out-of-stock products...');
    const filesToDelete = new Set();
    let mediaCount = 0;

    for (const product of outOfStockProducts) {
      // Main product images
      if (Array.isArray(product.images)) {
        for (const imgUrl of product.images) {
          const fileName = extractFileNameFromUrl(imgUrl);
          if (fileName) {
            filesToDelete.add(fileName);
            mediaCount++;
          }
        }
      }

      // Main product videos
      if (Array.isArray(product.videos)) {
        for (const vidUrl of product.videos) {
          const fileName = extractFileNameFromUrl(vidUrl);
          if (fileName) {
            filesToDelete.add(fileName);
            mediaCount++;
          }
        }
      }

      // Variant images
      if (Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          if (Array.isArray(variant.images)) {
            for (const imgUrl of variant.images) {
              const fileName = extractFileNameFromUrl(imgUrl);
              if (fileName) {
                filesToDelete.add(fileName);
                mediaCount++;
              }
            }
          }
        }
      }
    }

    console.log(`   Found ${mediaCount} media files to remove`);
    console.log(`   Total unique files: ${filesToDelete.size}`);

    if (filesToDelete.size === 0) {
      console.log('   ✅ No media files found - nothing to delete');
      await mongoose.disconnect();
      return;
    }

    // Step 3: Find and delete these files from GridFS
    console.log('\n3️⃣ Deleting media files from GridFS...');

    let deletedCount = 0;
    let failedCount = 0;
    let sizeBefore = 0;
    let sizeAfter = 0;

    // Get size before
    const statsBeforeAgg = await filesColl.aggregate([
      { 
        $match: { 
          filename: { $in: Array.from(filesToDelete) } 
        } 
      },
      { $group: { _id: null, totalSize: { $sum: '$length' } } }
    ]).toArray();
    sizeBefore = statsBeforeAgg[0] ? statsBeforeAgg[0].totalSize : 0;

    if (dryRun) {
      console.log(`   [DRY RUN] Would delete ${filesToDelete.size} files`);
      console.log(`   [DRY RUN] Would free up ${(sizeBefore / (1024 * 1024)).toFixed(2)} MB`);
      deletedCount = filesToDelete.size;
    } else {
      for (const fileName of filesToDelete) {
        try {
          const fileDoc = await filesColl.findOne({ filename: fileName });
          if (fileDoc) {
            await bucket.delete(fileDoc._id);
            deletedCount++;
          }
        } catch (err) {
          console.error(`   ⚠️ Failed to delete ${fileName}: ${err.message}`);
          failedCount++;
        }
      }

      // Get size after
      const statsAfterAgg = await filesColl.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$length' } } }
      ]).toArray();
      sizeAfter = statsAfterAgg[0] ? statsAfterAgg[0].totalSize : 0;
    }

    console.log(`   ✅ Deleted: ${deletedCount} files`);
    if (failedCount > 0) {
      console.log(`   ⚠️ Failed: ${failedCount} files`);
    }

    // Step 4: Verify in-stock products' media is safe
    console.log('\n4️⃣ Verifying in-stock products are safe...');
    const inStockProducts = await productsColl
      .find({ status: 'active' })
      .project({ _id: 1, name: 1, images: 1 })
      .limit(1)
      .toArray();

    if (inStockProducts.length > 0) {
      const sample = inStockProducts[0];
      if (Array.isArray(sample.images) && sample.images.length > 0) {
        const sampleImgUrl = sample.images[0];
        const sampleFileName = extractFileNameFromUrl(sampleImgUrl);
        const stillExists = await filesColl.findOne({ filename: sampleFileName });
        if (stillExists) {
          console.log(`   ✅ Verified: In-stock product images are SAFE`);
          console.log(`      Sample: ${sample.name} → image still exists`);
        } else {
          console.log(`   ⚠️ WARNING: Sample in-stock product image was deleted!`);
        }
      }
    }

    // Step 5: Final report
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Processed: ${outOfStockProducts.length} out-of-stock products`);
    console.log(`   Deleted: ${deletedCount} media files`);
    if (!dryRun && sizeBefore > 0) {
      const freedMB = ((sizeBefore - sizeAfter) / (1024 * 1024)).toFixed(2);
      console.log(`   Space freed: ${freedMB} MB`);
    } else if (dryRun) {
      console.log(`   Space to free: ${(sizeBefore / (1024 * 1024)).toFixed(2)} MB`);
    }

    // Step 6: Show latest storage stats
    console.log('\n📈 Current Storage Stats:');
    const totalStats = await filesColl.aggregate([
      { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: '$length' } } }
    ]).toArray();

    if (totalStats.length > 0) {
      const stats = totalStats[0];
      const totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      const usagePercent = ((stats.totalSize / (512 * 1024 * 1024)) * 100).toFixed(2);
      console.log(`   Total files: ${stats.totalFiles}`);
      console.log(`   Total size: ${totalSizeMB} MB`);
      console.log(`   Usage: ${usagePercent}% of 512 MB`);

      if (usagePercent > 80) {
        console.log(`   ⚠️ Still high usage. Consider more aggressive cleanup.`);
      } else {
        console.log(`   ✅ Storage is healthy`);
      }
    }

    if (dryRun) {
      console.log('\n⚠️ DRY RUN MODE - No files were deleted.');
      console.log('Run without --dry-run to execute cleanup.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Extract filename from URL like /api/upload?file=FILENAME
 */
function extractFileNameFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null;

    // Handle /api/upload?file=FILENAME format
    if (url.includes('/api/upload?file=')) {
      const matches = url.match(/file=([^&]+)/);
      if (matches) return decodeURIComponent(matches[1]);
    }

    // If it's just a filename
    if (url.includes('-') && !url.includes('/')) {
      return url;
    }

    return null;
  } catch (err) {
    return null;
  }
}

main();

#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config();

// Usage: node scripts/cleanup-gridfs-old.js --days=30 [--dry-run]
const args = require('minimist')(process.argv.slice(2));
const days = Number(args.days || 30);
const dryRun = !!args['dry-run'];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const filesColl = db.collection('uploads.files');
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(`Deleting files older than ${days} days (cutoff=${cutoff.toISOString()})`);

  const files = await filesColl.find({ uploadDate: { $lt: cutoff } }).toArray();
  console.log('Found', files.length, 'files to delete');
  for (const f of files) {
    console.log((dryRun ? '[DRY]' : '[DELETE]'), f._id.toString(), f.filename, f.uploadDate, f.length);
    if (!dryRun) {
      try {
        await bucket.delete(f._id);
      } catch (err) {
        console.error('Failed to delete', f._id, err);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
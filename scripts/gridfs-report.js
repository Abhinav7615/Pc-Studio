#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const filesColl = db.collection('uploads.files');
  const chunksColl = db.collection('uploads.chunks');

  const totalFiles = await filesColl.countDocuments();
  const totalSizeAgg = await filesColl.aggregate([
    { $group: { _id: null, total: { $sum: '$length' } } }
  ]).toArray();
  const totalSize = totalSizeAgg[0] ? totalSizeAgg[0].total : 0;

  console.log('GridFS report');
  console.log('Total files:', totalFiles);
  console.log('Total bytes (sum length):', totalSize);

  const oldest = await filesColl.find().sort({ uploadDate: 1 }).limit(20).toArray();
  console.log('\nOldest 20 files:');
  oldest.forEach(f => console.log(f._id.toString(), f.filename, f.uploadDate, f.length, f.metadata));

  const largest = await filesColl.find().sort({ length: -1 }).limit(50).toArray();
  console.log('\nLargest 50 files:');
  largest.forEach(f => console.log(f._id.toString(), f.filename, f.uploadDate, f.length, f.metadata));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Report failed:', err);
  process.exit(1);
});
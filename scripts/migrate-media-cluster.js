#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const minimist = require('minimist');

dotenv.config();

const args = minimist(process.argv.slice(2), {
  boolean: ['dry-run', 'help'],
  string: ['bucket', 'oldBucket', 'newBucket'],
  alias: { h: 'help' }
});

if (args.help) {
  console.log(`Usage: node scripts/migrate-media-cluster.js [--dry-run] [--bucket=fs] [--oldBucket=fs] [--newBucket=fs]`
    + `\n\nEnvironment variables:`
    + `\n  MONGODB_URI             Old primary cluster URI`
    + `\n  MONGODB_MEDIA_URI       New media cluster URI`
    + `\n  MONGODB_DB_NAME         Optional old cluster DB name if not present in URI`
    + `\n  MONGODB_MEDIA_DB_NAME   Optional media cluster DB name if not present in URI`
  );
  process.exit(0);
}

const OLD_URI = process.env.MONGODB_URI;
const NEW_URI = process.env.MONGODB_MEDIA_URI;
const OLD_DB_NAME = process.env.MONGODB_DB_NAME;
const NEW_DB_NAME = process.env.MONGODB_MEDIA_DB_NAME;
const BUCKET_NAME = args.bucket || args.oldBucket || args.newBucket || 'fs';

if (!OLD_URI || !NEW_URI) {
  console.error('ERROR: Both MONGODB_URI and MONGODB_MEDIA_URI must be set.');
  process.exit(1);
}

function parseDbName(uri) {
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'http://'));
    if (parsed.pathname && parsed.pathname !== '/' ) {
      return parsed.pathname.slice(1);
    }
  } catch {
    // ignore invalid URL parsing for SRV-style URIs without DB name
  }
  return undefined;
}

const oldDbName = OLD_DB_NAME || parseDbName(OLD_URI);
const newDbName = NEW_DB_NAME || parseDbName(NEW_URI);

if (!oldDbName || !newDbName) {
  console.error('ERROR: Could not determine DB name from URI. Please set MONGODB_DB_NAME and MONGODB_MEDIA_DB_NAME.');
  process.exit(1);
}

const dryRun = Boolean(args['dry-run']);

async function copyCollection(source, target, label) {
  const count = await source.countDocuments();
  console.log(`  ${label}: ${count} documents found`);
  if (dryRun) return count;

  if (count === 0) return 0;

  const cursor = source.find({}).batchSize(500);
  let inserted = 0;
  while (await cursor.hasNext()) {
    const batch = [];
    for (let i = 0; i < 500 && await cursor.hasNext(); i += 1) {
      batch.push(await cursor.next());
    }

    if (batch.length === 0) break;
    try {
      const result = await target.insertMany(batch, { ordered: false });
      inserted += result.insertedCount;
    } catch (err) {
      if (err.code === 11000 || err.codeName === 'DuplicateKey') {
        for (const doc of batch) {
          try {
            await target.insertOne(doc);
            inserted += 1;
          } catch (innerErr) {
            if (innerErr.code === 11000 || innerErr.codeName === 'DuplicateKey') continue;
            throw innerErr;
          }
        }
      } else {
        throw err;
      }
    }
  }

  return inserted;
}

async function migrateGridFS(bucketName, oldDb, newDb) {
  const oldFiles = oldDb.collection(`${bucketName}.files`);
  const oldChunks = oldDb.collection(`${bucketName}.chunks`);
  const newFiles = newDb.collection(`${bucketName}.files`);
  const newChunks = newDb.collection(`${bucketName}.chunks`);

  console.log(`\nCopying GridFS bucket '${bucketName}'...`);
  console.log('Checking file documents...');
  const fileCount = await oldFiles.countDocuments();
  console.log('Checking chunk documents...');
  const chunkCount = await oldChunks.countDocuments();

  if (dryRun) {
    console.log(`  Files: ${fileCount}, Chunks: ${chunkCount}`);
    return { fileCount, chunkCount, copiedFiles: 0, copiedChunks: 0 };
  }

  const copiedFiles = await copyCollection(oldFiles, newFiles, `GridFS files (${bucketName}.files)`);
  const copiedChunks = await copyCollection(oldChunks, newChunks, `GridFS chunks (${bucketName}.chunks)`);
  return { fileCount, chunkCount, copiedFiles, copiedChunks };
}

async function run() {
  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    console.log('Connecting to old cluster...');
    await oldClient.connect();
    console.log('Connecting to new media cluster...');
    await newClient.connect();

    const oldDb = oldClient.db(oldDbName);
    const newDb = newClient.db(newDbName);

    console.log(`\nOld DB: ${oldDbName}`);
    console.log(`New media DB: ${newDbName}`);
    console.log(`GridFS bucket: ${BUCKET_NAME}`);
    console.log(dryRun ? 'DRY RUN enabled. No documents will be inserted.' : 'Performing migration.');

    console.log('\nCopying media metadata collections...');
    const metadataCopied = await copyCollection(oldDb.collection('mediametadatas'), newDb.collection('mediametadatas'), 'Media metadata');
    const deletedMetadataCopied = await copyCollection(oldDb.collection('deletedmedias'), newDb.collection('deletedmedias'), 'Deleted media metadata');

    const gridFsResult = await migrateGridFS(BUCKET_NAME, oldDb, newDb);

    console.log('\nMigration summary:');
    console.log(`  Media metadata docs found: ${metadataCopied}`);
    console.log(`  Deleted media docs found: ${deletedMetadataCopied}`);
    console.log(`  GridFS files copied: ${gridFsResult.copiedFiles}/${gridFsResult.fileCount}`);
    console.log(`  GridFS chunks copied: ${gridFsResult.copiedChunks}/${gridFsResult.chunkCount}`);
    console.log(dryRun ? '\nDry run complete. No changes were written.' : '\nMigration complete. Verify new cluster data before decommissioning the old cluster.');
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

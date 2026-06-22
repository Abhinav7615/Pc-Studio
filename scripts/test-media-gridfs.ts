import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import mediaGridFS from '@/lib/mediaGridFS';
import MediaMetadata from '@/models/MediaMetadata';
import { uploadMediaWithMetadata } from '@/lib/mediaStorage';

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri, { dbName: 'test' });

  console.log('Connected to in-memory mongo for GridFS test');

  const buffer = Buffer.from('hello world');
  const filename = 'test.txt';

  const fileId = await mediaGridFS.uploadBufferToGridFS(buffer, filename, 'text/plain');
  console.log('Uploaded fileId:', fileId.toString());

  // create metadata using media model
  const metadata = await uploadMediaWithMetadata(fileId.toString(), filename, buffer.length, 'text/plain', 'other', 'other', {}, new mongoose.Types.ObjectId().toString());
  console.log('Metadata created:', metadata._id.toString());

  // delete file
  await mediaGridFS.deleteFromGridFS(fileId);
  console.log('Deleted from GridFS');

  // cleanup
  await mongoose.disconnect();
  await mongod.stop();
  console.log('Test completed');
}

run().catch(err => { console.error('Test failed', err); process.exit(1); });

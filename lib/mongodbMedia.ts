import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const rawUri = process.env.MONGODB_MEDIA_URI || '';

const opts = {
  bufferCommands: process.env.NODE_ENV === 'production' ? false : true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 15000,
  connectTimeoutMS: 15000,
};

let mediaConnection: mongoose.Connection | null = null;

if (rawUri) {
  // createConnection returns a Connection immediately and connects in background
  const conn = mongoose.createConnection(rawUri, opts);
  mediaConnection = conn;
  conn.on('connected', () => console.log('Connected to media MongoDB'));
  conn.on('error', (err) => console.warn('Media MongoDB connection error', err));
} else {
  // Fall back to default mongoose connection
  mediaConnection = mongoose.connection;
}

export default mediaConnection;

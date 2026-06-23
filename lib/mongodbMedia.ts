import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();
dotenv.config({ path: '.env.local' });

const rawUri = process.env.MONGODB_MEDIA_URI?.trim() || '';

const opts = {
  bufferCommands: process.env.NODE_ENV === 'production' ? false : true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 15000,
  connectTimeoutMS: 15000,
};

function isPlaceholderUri(uri: string) {
  return /\[USER\]|\[PASS\]|\[HASH\]|<username>|<password>|example\.mongodb\.net/i.test(uri);
}

let mediaConnection: mongoose.Connection | null = null;
let mediaConnectionPromise: Promise<mongoose.Connection> | null = null;

function createMediaConnection() {
  if (!rawUri || isPlaceholderUri(rawUri)) {
    if (rawUri) {
      console.warn('Media MongoDB URI appears to be a placeholder or invalid; skipping media cluster connection.');
    }
    return null;
  }

  if (mediaConnection) {
    return mediaConnection;
  }

  const conn = mongoose.createConnection(rawUri, opts);
  mediaConnection = conn;
  mediaConnectionPromise = conn.asPromise();
  conn.on('connected', () => console.log('Connected to media MongoDB'));
  conn.on('error', (err) => console.warn('Media MongoDB connection error', err));
  return conn;
}

export async function connectMediaDb() {
  if (!rawUri || isPlaceholderUri(rawUri)) {
    throw new Error('MONGODB_MEDIA_URI is not defined or appears to be a placeholder');
  }

  if (!mediaConnection) {
    createMediaConnection();
  }

  if (mediaConnection?.readyState === 1) {
    return mediaConnection;
  }

  if (mediaConnectionPromise) {
    await mediaConnectionPromise;
    return mediaConnection;
  }

  throw new Error('Media MongoDB connection is not ready');
}

export default mediaConnection;

import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Use a known public DNS server for SRV resolution so Node can resolve Atlas SRV records reliably.
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: '.env.local' });

const rawMongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || '';

function normalizeMongoUri(uri: string) {
  if (!uri) return uri;

  // Check if URI starts with mongodb scheme
  const schemeMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/i);
  if (!schemeMatch) {
    return uri;
  }

  const prefix = schemeMatch[1];
  const rest = uri.slice(prefix.length);
  const lastAtIndex = rest.lastIndexOf('@');

  if (lastAtIndex <= 0) {
    return uri;
  }

  const authPart = rest.slice(0, lastAtIndex);
  const hostPart = rest.slice(lastAtIndex + 1);

  if (!authPart.includes(':')) {
    return uri;
  }

  const colonIndex = authPart.indexOf(':');
  const username = authPart.slice(0, colonIndex);
  const password = authPart.slice(colonIndex + 1);
  const encodedPassword = encodeURIComponent(password);
  return `${prefix}${username}:${encodedPassword}@${hostPart}`;
}

const MONGODB_URI = normalizeMongoUri(rawMongoUri);

export { MONGODB_URI };

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI or MONGODB_URL environment variable inside .env.local or Vercel settings');
}

interface MongoCache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; }

const globalWithMongoose = global as unknown as { mongoose?: MongoCache };
let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  globalWithMongoose.mongoose = cached;
}

async function dbConnect() {
  if (!cached) {
    cached = { conn: null, promise: null };
    globalWithMongoose.mongoose = cached;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
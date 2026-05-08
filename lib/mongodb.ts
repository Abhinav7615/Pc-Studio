import dns from 'dns';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Use a known public DNS server for SRV resolution so Node can resolve Atlas SRV records reliably.
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load generic .env first, then override with .env.local when present.
dotenv.config();
dotenv.config({ path: '.env.local' });

const rawMongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL || '';
const rawFallbackMongoUri = process.env.MONGODB_FALLBACK_URI || process.env.MONGODB_LOCAL_URI || '';

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
const MONGODB_FALLBACK_URI = normalizeMongoUri(rawFallbackMongoUri);

export { MONGODB_URI, MONGODB_FALLBACK_URI };

function isSrvUri(uri: string) {
  return /^mongodb\+srv:/i.test(uri);
}

function isDnsError(err: unknown) {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as any;
  return anyErr?.code === 'ECONNREFUSED' || anyErr?.code === 'ENOTFOUND' || anyErr?.code === 'EAI_AGAIN' || String(anyErr?.message).includes('querySrv');
}

let memoryServer: MongoMemoryServer | null = null;

async function startMemoryServer() {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }
  return memoryServer.getUri();
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

  const opts = {
    bufferCommands: process.env.NODE_ENV === 'production' ? false : true,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  };

  const resetConnection = async () => {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        // ignore disconnect errors during fallback
      }
    }
  };

  const connectWithUri = async (uri: string) => {
    await resetConnection();
    await mongoose.connect(uri, opts);
    await mongoose.connection.asPromise();
    return mongoose;
  };

  const connectWithMemory = async () => {
    const uri = await startMemoryServer();
    return connectWithUri(uri);
  };

  const initializeConnection = async () => {
    if (MONGODB_URI) {
      try {
        return await connectWithUri(MONGODB_URI);
      } catch (primaryError) {
        if (MONGODB_FALLBACK_URI && isSrvUri(MONGODB_URI) && MONGODB_FALLBACK_URI !== MONGODB_URI && isDnsError(primaryError)) {
          console.warn('Primary MongoDB SRV connection failed, retrying with fallback URI.');
          try {
            return await connectWithUri(MONGODB_FALLBACK_URI);
          } catch (fallbackError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Fallback MongoDB URI failed, trying in-memory fallback.', fallbackError);
              return connectWithMemory();
            }
            throw fallbackError;
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          console.warn('Primary MongoDB connection failed, trying in-memory fallback.', primaryError);
          return connectWithMemory();
        }

        throw primaryError;
      }
    }

    if (MONGODB_FALLBACK_URI) {
      try {
        return await connectWithUri(MONGODB_FALLBACK_URI);
      } catch (fallbackError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Fallback MongoDB connection failed, trying in-memory fallback.', fallbackError);
          return connectWithMemory();
        }
        throw fallbackError;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      return connectWithMemory();
    }

    throw new Error('Please define the MONGODB_URI or MONGODB_URL environment variable inside .env.local, .env, or Vercel settings.');
  };

  if (!cached.promise) {
    cached.promise = initializeConnection();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 5000,
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
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbConnect();
    }

    // Run ping command to keep connection alive
    const admin = mongoose.connection.db?.admin();
    if (!admin) {
      return NextResponse.json(
        { status: 'error', message: 'MongoDB admin interface not available' },
        { status: 500 }
      );
    }

    const pingResult = await admin.ping();

    return NextResponse.json(
      {
        status: 'ok',
        message: 'MongoDB Active',
        timestamp: new Date().toISOString(),
        connection: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState,
        },
        ping: pingResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MongoDB ping error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to ping MongoDB',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

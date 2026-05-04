import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import SecretKey from '@/models/SecretKey';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const secretKeys = await SecretKey.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ secretKeys });
  } catch (error) {
    console.error('Get secret keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await request.json();

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    await dbConnect();

    // Generate a unique 8-character code
    let code: string;
    let attempts = 0;
    do {
      code = randomBytes(4).toString('hex').toUpperCase();
      attempts++;
      if (attempts > 10) {
        return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
      }
    } while (await SecretKey.findOne({ code }));

    const secretKey = new SecretKey({
      code,
      description: description.trim(),
      createdBy: session.user.id
    });

    await secretKey.save();

    return NextResponse.json({
      message: 'Secret key created successfully',
      secretKey
    });
  } catch (error) {
    console.error('Create secret key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Secret key ID is required' }, { status: 400 });
    }

    await dbConnect();

    const secretKey = await SecretKey.findByIdAndDelete(id);

    if (!secretKey) {
      return NextResponse.json({ error: 'Secret key not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Secret key deleted successfully' });
  } catch (error) {
    console.error('Delete secret key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
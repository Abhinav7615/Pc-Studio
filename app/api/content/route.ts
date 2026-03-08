import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const contents = await Content.find({}).sort({ updatedAt: -1 });

    return NextResponse.json(contents, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { key, title, content } = await request.json();

    if (!key || !title || !content) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingContent = await Content.findOne({ key });

    if (existingContent) {
      return NextResponse.json({ error: 'Content key already exists' }, { status: 400 });
    }

    const newContent = new Content({ key, title, content });
    await newContent.save();

    return NextResponse.json(newContent, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

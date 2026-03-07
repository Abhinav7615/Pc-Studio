import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  try {
    await dbConnect();

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings();
      await settings.save();
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings(body);
    } else {
      Object.assign(settings, body);
    }

    await settings.save();

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
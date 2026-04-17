import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BusinessSettings from '@/models/BusinessSettings';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id || session.user.role !== 'admin' || (session.user as any).adminEmail !== 'admin@example.com') {
      return NextResponse.json({ error: 'Only main admin can reset settings' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Admin password is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user || !user.adminPassword) {
      return NextResponse.json({ error: 'Admin password not set' }, { status: 400 });
    }

    // Verify admin password
    const isValid = await bcrypt.compare(password, user.adminPassword);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect admin password' }, { status: 400 });
    }

    // Delete existing settings to reset to defaults
    await BusinessSettings.deleteMany({});

    // Create new settings with defaults
    const defaultSettings = new BusinessSettings();
    await defaultSettings.save();

    return NextResponse.json({
      message: 'All settings have been reset to default values',
      success: true
    }, { status: 200 });

  } catch (error) {
    console.error('Reset settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
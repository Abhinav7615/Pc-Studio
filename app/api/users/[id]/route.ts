import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.adminEmail) {
      return NextResponse.json({ error: 'Default admin account cannot be modified' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(id, { password: hashedPassword });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('User password reset failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body: Record<string, unknown> = await request.json();
    const { blocked, role } = body;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.adminEmail) {
      return NextResponse.json({ error: 'Default admin account cannot be modified' }, { status: 403 });
    }

    const updateData: { blocked?: boolean; name?: string; email?: string; mobile?: string; role?: string } = {};

    if (typeof blocked === 'boolean') {
      if (user.adminEmail) {
        return NextResponse.json({ error: 'Cannot block default admin account' }, { status: 400 });
      }
      updateData.blocked = blocked;
    }

    if (typeof role === 'string' && ['customer', 'staff', 'admin'].includes(role)) {
      if (user.adminEmail) {
        return NextResponse.json({ error: 'Cannot change role of default admin account' }, { status: 400 });
      }
      // allow main admin to demote secondary admins from admin -> staff/customer
      updateData.role = role;
    }

    // Allow name/email/mobile updates from admin.
    const { name, email, mobile } = body as { name?: unknown; email?: unknown; mobile?: unknown };

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail) {
        // Ensure uniqueness (excluding self)
        const existingByEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (existingByEmail) {
          return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (typeof mobile === 'string' && mobile.trim()) {
      const normalizedMobile = mobile.trim();
      const existingByMobile = await User.findOne({ mobile: normalizedMobile, _id: { $ne: id } });
      if (existingByMobile) {
        return NextResponse.json({ error: 'Mobile number is already in use' }, { status: 400 });
      }
      updateData.mobile = normalizedMobile;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    await User.findByIdAndUpdate(id, updateData);

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('User update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.adminEmail) {
      return NextResponse.json({ error: 'Default admin account cannot be deleted' }, { status: 403 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    console.error('User deletion failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
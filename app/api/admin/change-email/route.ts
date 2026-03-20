import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { newAdminEmail, currentPassword } = await req.json();

    if (!newAdminEmail || !currentPassword) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the current user
    const user = await User.findById(session.user.id);

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password (regular password for security)
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new admin email already exists
    const existingAdmin = await User.findOne({
      adminEmail: newAdminEmail,
      _id: { $ne: user._id },
    });

    if (existingAdmin) {
      return Response.json(
        { error: 'This admin email is already in use' },
        { status: 400 }
      );
    }

    // Set admin email (separate from regular email)
    user.adminEmail = newAdminEmail;
    await user.save();

    return Response.json(
      { message: 'Admin email updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change admin email error:', error);
    return Response.json(
      { error: 'Failed to update admin email' },
      { status: 500 }
    );
  }
}

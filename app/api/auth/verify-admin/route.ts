import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { adminEmail, adminPassword } = await req.json();

    if (!adminEmail || !adminPassword) {
      return Response.json(
        { error: 'Admin email and password are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by admin email
    const user = await User.findOne({
      adminEmail: adminEmail,
    });

    if (!user) {
      return Response.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Check if user is admin or staff
    if (user.role !== 'admin' && user.role !== 'staff') {
      return Response.json(
        { error: 'User does not have admin access' },
        { status: 401 }
      );
    }

    // Verify admin password
    if (!user.adminPassword) {
      return Response.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(adminPassword, user.adminPassword);

    if (!isPasswordValid) {
      return Response.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Return success with user info
    return Response.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          adminEmail: user.adminEmail,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify admin credentials error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

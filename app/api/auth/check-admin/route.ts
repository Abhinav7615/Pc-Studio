import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return Response.json(
        { isAdmin: false },
        { status: 200 }
      );
    }

    await dbConnect();

    // Check if identifier is an admin email
    const adminUser = await User.findOne({
      adminEmail: identifier,
    });

    if (adminUser && adminUser.role === 'admin' || adminUser?.role === 'staff') {
      return Response.json(
        { isAdmin: true, message: 'This is an admin account' },
        { status: 200 }
      );
    }

    return Response.json(
      { isAdmin: false },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check admin email error:', error);
    return Response.json(
      { isAdmin: false },
      { status: 200 }
    );
  }
}

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return Response.json(
        { isAdmin: false, isStaff: false },
        { status: 200 }
      );
    }

    await dbConnect();

    // First check if identifier is an admin/staff email (special admin login)
    let user = await User.findOne({
      adminEmail: identifier,
    });

    if (user) {
      if (user.role === 'admin') {
        return Response.json(
          { isAdmin: true, isStaff: false, message: 'This is an admin account' },
          { status: 200 }
        );
      } else if (user.role === 'staff') {
        return Response.json(
          { isAdmin: false, isStaff: true, message: 'This is a staff account' },
          { status: 200 }
        );
      }
    }

    // Also check if identifier is a staff member using their regular email or mobile
    user = await User.findOne({
      $or: [
        { email: identifier },
        { mobile: identifier }
      ],
      role: 'staff'
    });

    if (user && user.role === 'staff') {
      return Response.json(
        { isAdmin: false, isStaff: true, message: 'This is a staff account' },
        { status: 200 }
      );
    }

    return Response.json(
      { isAdmin: false, isStaff: false },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check admin email error:', error);
    return Response.json(
      { isAdmin: false, isStaff: false },
      { status: 200 }
    );
  }
}

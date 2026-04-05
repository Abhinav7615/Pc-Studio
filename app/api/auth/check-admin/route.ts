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

    const normalizedId = identifier.trim();
    const mobileId = identifier.trim();
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idRegex = new RegExp(`^${escapeRegExp(normalizedId)}$`, 'i');

    // Check identifier against admin/staff records: adminEmail, email, or mobile (case-insensitive for emails)
    const user = await User.findOne({
      $or: [
        { adminEmail: idRegex },
        { email: idRegex },
        { mobile: mobileId }
      ]
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

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
    const mobileDigits = identifier.replace(/\D/g, '');
    const normalizedMobile = mobileDigits.length === 10
      ? mobileDigits
      : mobileDigits.length === 12 && mobileDigits.startsWith('91')
        ? mobileDigits.slice(-10)
        : '';
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idRegex = new RegExp(`^${escapeRegExp(normalizedId)}$`, 'i');
    const mobileRegex = normalizedMobile ? new RegExp(`^(?:\\+?91)?${normalizedMobile}$`) : null;

    // Check identifier against admin/staff records: adminEmail, email, or mobile
    const query: any = {
      $or: [
        { adminEmail: idRegex },
        { email: idRegex },
        ...(mobileRegex ? [{ mobile: normalizedMobile }, { mobile: mobileRegex }] : []),
      ],
    };

    const user = await User.findOne(query);

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

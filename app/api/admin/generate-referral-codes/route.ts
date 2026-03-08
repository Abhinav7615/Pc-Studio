import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { generateReferralCodesForExistingUsers } from '@/lib/generateReferralCodes';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await generateReferralCodesForExistingUsers();

    return NextResponse.json({ message: 'Referral codes generated for existing users' }, { status: 200 });
  } catch (error) {
    console.error('Error generating referral codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
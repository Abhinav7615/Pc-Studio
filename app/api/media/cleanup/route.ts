import { NextRequest, NextResponse } from 'next/server';
import { runDailyCleanup, runWeeklyCleanup, runMonthlyCleanup } from '@/lib/mediaCleanup';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { type } = await req.json();

    if (type === 'daily') await runDailyCleanup();
    else if (type === 'weekly') await runWeeklyCleanup();
    else if (type === 'monthly') await runMonthlyCleanup();
    else await runDailyCleanup();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}

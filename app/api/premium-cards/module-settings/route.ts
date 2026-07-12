import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import PremiumCardModuleSettings from '@/models/PremiumCardModuleSettings';

export async function GET() {
  await dbConnect();
  let settings = await PremiumCardModuleSettings.findOne({}).lean();
  if (!settings) {
    settings = await PremiumCardModuleSettings.create({});
  }
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  await dbConnect();
  const settings = await PremiumCardModuleSettings.findOneAndUpdate({}, { ...body, updatedAt: new Date() }, { upsert: true, new: true });
  return NextResponse.json(settings);
}

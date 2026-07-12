import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PaymentSettings from '@/models/PremiumCardPaymentSettings';

export async function GET() {
  await dbConnect();
  let settings = await PaymentSettings.findOne({}).lean();
  if (!settings) {
    settings = await PaymentSettings.create({});
  }
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await dbConnect();
  const settings = await PaymentSettings.findOneAndUpdate({}, { ...body, updatedAt: new Date() }, { upsert: true, new: true });
  return NextResponse.json(settings);
}

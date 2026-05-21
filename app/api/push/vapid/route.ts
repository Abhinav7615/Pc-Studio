import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC || '';
  return NextResponse.json({ publicKey }, { status: 200 });
}

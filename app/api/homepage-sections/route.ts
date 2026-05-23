import dbConnect from '@/lib/mongodb';
import HomepageSection from '@/models/HomepageSection';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  const sections = await HomepageSection.find({ isActive: true }).sort({ order: 1 });
  return NextResponse.json({ sections });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body.title || !body.type) return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
  const section = await HomepageSection.create({
    type: body.type,
    title: body.title,
    subtitle: body.subtitle || '',
    image: body.image || '',
    link: body.link || '',
    order: body.order ?? 0,
    isActive: body.isActive ?? true,
    content: body.content || '',
  });
  return NextResponse.json({ section });
}

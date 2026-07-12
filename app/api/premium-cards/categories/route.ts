import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CardCategory from '@/models/PremiumCardCategory';

export async function GET() {
  await dbConnect();
  const categories = await CardCategory.find({ status: 'active' }).sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  await dbConnect();
  const category = await CardCategory.create({
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: body.description || '',
    status: body.status || 'active',
  });
  return NextResponse.json(category);
}

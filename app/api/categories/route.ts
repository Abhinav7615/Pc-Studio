import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  const categories = await Category.find({}).sort({ order: 1, name: 1 });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const category = await Category.create({
    name: body.name,
    icon: body.icon || '',
    order: body.order ?? 0,
    isActive: body.isActive ?? true,
  });
  return NextResponse.json({ category });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import CardCategory from '@/models/PremiumCardCategory';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const category = await CardCategory.findById(id);
  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin' && session?.user?.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  await dbConnect();
  const { id } = await params;
  const category = await CardCategory.findById(id);
  if (!category) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (body.name !== undefined) category.name = body.name;
  if (body.slug !== undefined) category.slug = body.slug;
  if (body.description !== undefined) category.description = body.description;
  if (body.status !== undefined) category.status = body.status;
  if (body.image !== undefined) category.image = body.image;
  if (body.typeImages !== undefined) category.typeImages = body.typeImages;

  await category.save();
  return NextResponse.json(category);
}

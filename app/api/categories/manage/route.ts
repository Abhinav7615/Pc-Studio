import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body._id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const update: any = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.icon !== undefined) update.icon = body.icon;
  if (body.order !== undefined) update.order = body.order;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  const category = await Category.findByIdAndUpdate(body._id, update, { new: true });
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  return NextResponse.json({ category });
}

export async function DELETE(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body._id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const result = await Category.findByIdAndDelete(body._id);
  if (!result) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

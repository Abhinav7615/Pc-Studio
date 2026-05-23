import dbConnect from '@/lib/mongodb';
import HomepageSection from '@/models/HomepageSection';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body._id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const update: any = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.type !== undefined) update.type = body.type;
  if (body.subtitle !== undefined) update.subtitle = body.subtitle;
  if (body.image !== undefined) update.image = body.image;
  if (body.link !== undefined) update.link = body.link;
  if (body.order !== undefined) update.order = body.order;
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.content !== undefined) update.content = body.content;
  const section = await HomepageSection.findByIdAndUpdate(body._id, update, { new: true });
  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  return NextResponse.json({ section });
}

export async function DELETE(req: Request) {
  await dbConnect();
  const body = await req.json();
  if (!body._id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  const result = await HomepageSection.findByIdAndDelete(body._id);
  if (!result) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

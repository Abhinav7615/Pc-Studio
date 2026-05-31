import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Wishlist from '@/models/Wishlist';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  await dbConnect();
  const wishlists = await Wishlist.find({}).lean();
  const userIds = wishlists.map((w: any) => w.user);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap: Record<string, { name: string; email: string }> = {};
  users.forEach((u: any) => {
    userMap[u._id.toString()] = { name: u.name, email: u.email };
  });
  return NextResponse.json({ wishlists, users: userMap });
}

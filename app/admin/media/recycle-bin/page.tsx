import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import DeletedMedia from '@/models/DeletedMedia';
import RecycleBinManager from '@/components/RecycleBinManager';

export default async function RecycleBinPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    redirect('/admin/login');
  }

  await dbConnect();
  const items = await DeletedMedia.find({ recoveredAt: null, permanentlyDeletedAt: null })
    .sort({ deletedAt: -1 })
    .limit(200)
    .lean();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Recycle Bin</h1>
      <RecycleBinManager initialItems={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}

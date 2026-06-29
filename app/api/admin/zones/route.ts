import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Zone from '@/models/Zone';

export async function GET() {
  try {
    await dbConnect();
    let zones = await Zone.find({}).sort({ priority: -1 });

    // If no zones exist (fresh dev), create a set of example zones so admin UI shows them
    if (!zones || zones.length === 0) {
      const defaultZones = [
        { key: 'header-banner', title: 'Header Banner', description: 'Top banner in website header', sizes: ['728x90','970x90','1200x100'], status: 'enabled', priority: 10 },
        { key: 'footer-banner', title: 'Footer Banner', description: 'Footer advertisement zone', sizes: ['728x90','970x90'], status: 'enabled', priority: 5 },
        { key: 'sidebar-vertical', title: 'Sidebar Vertical', description: 'Right sidebar vertical ads', sizes: ['300x600','300x1050'], status: 'enabled', priority: 4 },
        { key: 'homepage-top', title: 'Homepage Top', description: 'Top section of homepage', sizes: ['970x250','728x90'], status: 'enabled', priority: 8 },
        { key: 'product-sidebar', title: 'Product Page Sidebar', description: 'Sidebar ads on product pages', sizes: ['300x600'], status: 'enabled', priority: 3 },
      ];
      try {
        await Zone.insertMany(defaultZones);
      } catch (e) {
        // ignore duplicate key errors or other insertion issues
        console.warn('Seeding default zones failed', e);
      }
      zones = await Zone.find({}).sort({ priority: -1 });
    }

    return NextResponse.json(zones, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const payload = await request.json();
    const z = new Zone(payload);
    await z.save();
    return NextResponse.json(z, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

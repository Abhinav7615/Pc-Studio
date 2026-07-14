import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import PremiumCardBannerSettings from '@/models/PremiumCardBannerSettings';

export async function GET() {
  try {
    await connect();
    let bannerSettings = await PremiumCardBannerSettings.findOne();
    
    if (!bannerSettings) {
      // Create default banner if it doesn't exist
      bannerSettings = new PremiumCardBannerSettings();
      await bannerSettings.save();
    }
    
    return NextResponse.json(bannerSettings);
  } catch (error) {
    console.error('Failed to fetch banner settings:', error);
    return NextResponse.json({ error: 'Failed to fetch banner settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    
    if (!body) {
      return NextResponse.json({ error: 'Invalid banner settings payload' }, { status: 400 });
    }
    
    let bannerSettings = await PremiumCardBannerSettings.findOne();
    
    if (!bannerSettings) {
      bannerSettings = new PremiumCardBannerSettings(body);
    } else {
      Object.assign(bannerSettings, body);
      bannerSettings.updatedAt = new Date();
    }
    
    await bannerSettings.save();
    return NextResponse.json(bannerSettings);
  } catch (error) {
    console.error('Failed to update banner settings:', error);
    return NextResponse.json({ error: 'Failed to update banner settings' }, { status: 500 });
  }
}

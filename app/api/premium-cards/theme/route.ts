import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/mongodb';
import PremiumCardTheme from '@/models/PremiumCardTheme';

export async function GET() {
  try {
    await connect();
    let theme = await PremiumCardTheme.findOne();
    
    if (!theme) {
      // Create default theme if it doesn't exist
      theme = new PremiumCardTheme();
      await theme.save();
    }
    
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Failed to fetch theme:', error);
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    
    if (!body) {
      return NextResponse.json({ error: 'Invalid theme payload' }, { status: 400 });
    }
    
    let theme = await PremiumCardTheme.findOne();
    
    if (!theme) {
      theme = new PremiumCardTheme(body);
    } else {
      Object.assign(theme, body);
      theme.updatedAt = new Date();
    }
    
    await theme.save();
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Failed to update theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}

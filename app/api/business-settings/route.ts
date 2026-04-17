import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  try {
    await dbConnect();

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings();
      await settings.save();
    }

    // Ensure stateShippingCharges exists and is an object
    if (!settings.stateShippingCharges || typeof settings.stateShippingCharges !== 'object') {
      settings.stateShippingCharges = {};
    }

    // Convert to object and ensure stateShippingCharges is a plain object
    const result = settings.toObject();
    if (result.stateShippingCharges && typeof result.stateShippingCharges === 'object' && !Array.isArray(result.stateShippingCharges)) {
      // Already an object
    } else {
      result.stateShippingCharges = {};
    }

    return NextResponse.json({
      ...result,
      chatBotIntroMessage: result.chatBotIntroMessage || '',
      chatJoinMessage: result.chatJoinMessage || 'An agent has joined your chat and will respond shortly.',
      chatEndMessage: result.chatEndMessage || 'Thank you for chatting with us. If you need anything else, we are here to help!',
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('API GET - Error:', error);
    return NextResponse.json({
      siteOpen: true,
      websiteName: 'Refurbished PC Studio',
      offlineShopEnabled: false,
      stateShippingCharges: {},
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Normalize and sanitize phone number fields
    if (body.whatsapp !== undefined) {
      body.whatsapp = String(body.whatsapp).trim();
    }
    if (body.contactWhatsapp !== undefined) {
      body.contactWhatsapp = String(body.contactWhatsapp).trim();
    }
    if (body.contactEmail !== undefined) {
      body.contactEmail = String(body.contactEmail).trim();
    }
    if (body.websiteNameColor !== undefined) {
      body.websiteNameColor = String(body.websiteNameColor).trim();
    }
    if (body.contactWhatsappColor !== undefined) {
      body.contactWhatsappColor = String(body.contactWhatsappColor).trim();
    }
    if (body.contactEmailColor !== undefined) {
      body.contactEmailColor = String(body.contactEmailColor).trim();
    }
    if (body.adminWhatsapp !== undefined) {
      body.adminWhatsapp = String(body.adminWhatsapp).trim();
    }
    if (body.staffWhatsapp !== undefined) {
      body.staffWhatsapp = String(body.staffWhatsapp).trim();
    }
    if (body.offlineShopGoogleMapsLink !== undefined) {
      body.offlineShopGoogleMapsLink = String(body.offlineShopGoogleMapsLink).trim();
    }

    // Ensure stateShippingCharges is always an object with number values
    const stateShippingCharges: Record<string, number> = {};
    if (body.stateShippingCharges && typeof body.stateShippingCharges === 'object') {
      for (const [key, value] of Object.entries(body.stateShippingCharges)) {
        stateShippingCharges[key] = Number(value) || 0;
      }
    }

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings();
    }

    // Update all fields from body
    for (const key of Object.keys(body)) {
      if (key === 'stateShippingCharges') {
        (settings as any)[key] = stateShippingCharges;
      } else if (key !== '_id') {
        if (key === 'heroEnabled' || key === 'announcementEnabled' || key === 'welcomeEnabled' || key === 'featuresEnabled') {
          (settings as any)[key] = body[key] === true || body[key] === 'true';
        } else {
          (settings as any)[key] = body[key];
        }
      }
    }
    
    // Also set stateShippingCharges
    settings.stateShippingCharges = stateShippingCharges;

    await settings.save();

    // Return with proper object conversion
    const result = settings.toObject();
    return NextResponse.json({
      ...result,
      chatBotIntroMessage: result.chatBotIntroMessage || '',
      chatJoinMessage: result.chatJoinMessage || 'An agent has joined your chat and will respond shortly.',
      chatEndMessage: result.chatEndMessage || 'Thank you for chatting with us. If you need anything else, we are here to help!',
    }, { status: 200 });
  } catch (error) {
    console.error('API PUT - Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

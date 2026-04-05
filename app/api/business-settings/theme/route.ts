import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings();
    }

    // Save current settings to history before updating
    const currentThemeSettings = {
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      headingColor: settings.headingColor,
      websiteNameColor: settings.websiteNameColor,
      headerBgColor: settings.headerBgColor,
      footerBgColor: settings.footerBgColor,
      cardColor: settings.cardColor,
      cardBorderColor: settings.cardBorderColor,
      buttonPrimaryBg: settings.buttonPrimaryBg,
      buttonPrimaryText: settings.buttonPrimaryText,
      buttonSecondaryBg: settings.buttonSecondaryBg,
      buttonSecondaryText: settings.buttonSecondaryText,
      productCardBg: settings.productCardBg,
      productCardBorder: settings.productCardBorder,
      productPriceColor: settings.productPriceColor,
      productTitleColor: settings.productTitleColor,
      featureBgColor: settings.featureBgColor,
      featureCardBg: settings.featureCardBg,
      featureTextColor: settings.featureTextColor,
      heroEnabled: settings.heroEnabled,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      heroBgColor: settings.heroBgColor,
      heroTextColor: settings.heroTextColor,
      heroButtonText: settings.heroButtonText,
      heroButtonBg: settings.heroButtonBg,
      heroButtonTextColor: settings.heroButtonTextColor,
      announcementEnabled: settings.announcementEnabled,
      announcementText: settings.announcementText,
      announcementBgColor: settings.announcementBgColor,
      announcementTextColor: settings.announcementTextColor,
      welcomeEnabled: settings.welcomeEnabled,
      welcomeTitle: settings.welcomeTitle,
      welcomeSubtitle: settings.welcomeSubtitle,
      welcomeBgColor: settings.welcomeBgColor,
      welcomeTextColor: settings.welcomeTextColor,
      featuresEnabled: settings.featuresEnabled,
      feature1Icon: settings.feature1Icon,
      feature1Title: settings.feature1Title,
      feature1Text: settings.feature1Text,
      feature2Icon: settings.feature2Icon,
      feature2Title: settings.feature2Title,
      feature2Text: settings.feature2Text,
      feature3Icon: settings.feature3Icon,
      feature3Title: settings.feature3Title,
      feature3Text: settings.feature3Text,
      feature4Icon: settings.feature4Icon,
      feature4Title: settings.feature4Title,
      feature4Text: settings.feature4Text,
      fontFamily: settings.fontFamily,
      headingFontFamily: settings.headingFontFamily,
      buttonRadius: settings.buttonRadius,
      cardRadius: settings.cardRadius,
      containerMaxWidth: settings.containerMaxWidth,
    };

    // Add current settings to history
    const history = settings.customizationHistory || [];
    history.push({
      timestamp: new Date(),
      settings: currentThemeSettings,
    });

    // Keep only last 3 history items
    if (history.length > 3) {
      history.shift();
    }

    settings.customizationHistory = history;

    // Update theme settings explicitly to ensure booleans are saved
    settings.primaryColor = body.primaryColor;
    settings.secondaryColor = body.secondaryColor;
    settings.accentColor = body.accentColor;
    settings.backgroundColor = body.backgroundColor;
    settings.textColor = body.textColor;
    settings.headingColor = body.headingColor;
    settings.websiteNameColor = body.websiteNameColor;
    settings.headerBgColor = body.headerBgColor;
    settings.footerBgColor = body.footerBgColor;
    settings.cardColor = body.cardColor;
    settings.cardBorderColor = body.cardBorderColor;
    settings.buttonPrimaryBg = body.buttonPrimaryBg;
    settings.buttonPrimaryText = body.buttonPrimaryText;
    settings.buttonSecondaryBg = body.buttonSecondaryBg;
    settings.buttonSecondaryText = body.buttonSecondaryText;
    settings.productCardBg = body.productCardBg;
    settings.productCardBorder = body.productCardBorder;
    settings.productPriceColor = body.productPriceColor;
    settings.productTitleColor = body.productTitleColor;
    settings.featureBgColor = body.featureBgColor;
    settings.featureCardBg = body.featureCardBg;
    settings.featureTextColor = body.featureTextColor;
    settings.heroEnabled = toBoolean(body.heroEnabled);
    settings.heroTitle = body.heroTitle;
    settings.heroSubtitle = body.heroSubtitle;
    settings.heroBgColor = body.heroBgColor;
    settings.heroTextColor = body.heroTextColor;
    settings.heroButtonText = body.heroButtonText;
    settings.heroButtonBg = body.heroButtonBg;
    settings.heroButtonTextColor = body.heroButtonTextColor;
    settings.announcementEnabled = toBoolean(body.announcementEnabled);
    settings.announcementText = body.announcementText;
    settings.announcementBgColor = body.announcementBgColor;
    settings.announcementTextColor = body.announcementTextColor;
    settings.welcomeEnabled = toBoolean(body.welcomeEnabled);
    settings.welcomeTitle = body.welcomeTitle;
    settings.welcomeSubtitle = body.welcomeSubtitle;
    settings.welcomeBgColor = body.welcomeBgColor;
    settings.welcomeTextColor = body.welcomeTextColor;
    settings.featuresEnabled = toBoolean(body.featuresEnabled);
    settings.feature1Icon = body.feature1Icon;
    settings.feature1Title = body.feature1Title;
    settings.feature1Text = body.feature1Text;
    settings.feature2Icon = body.feature2Icon;
    settings.feature2Title = body.feature2Title;
    settings.feature2Text = body.feature2Text;
    settings.feature3Icon = body.feature3Icon;
    settings.feature3Title = body.feature3Title;
    settings.feature3Text = body.feature3Text;
    settings.feature4Icon = body.feature4Icon;
    settings.feature4Title = body.feature4Title;
    settings.feature4Text = body.feature4Text;
    settings.fontFamily = body.fontFamily;
    settings.headingFontFamily = body.headingFontFamily;
    settings.buttonRadius = body.buttonRadius;
    settings.cardRadius = body.cardRadius;
    settings.containerMaxWidth = body.containerMaxWidth;

    await settings.save();

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Theme PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

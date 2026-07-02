import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { connectMediaDb } from '@/lib/mongodbMedia';
import Ad from '@/models/Ad';
import Provider from '@/models/Provider';
import Zone from '@/models/Zone';
import Campaign from '@/models/Campaign';
import AdView from '@/models/AdView';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    try { await connectMediaDb(); } catch (e) { console.warn('Media DB not available', e); }

    // Get counts
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: 'active' });
    const draftAds = await Ad.countDocuments({ status: 'draft' });
    const disabledAds = await Ad.countDocuments({ status: 'disabled' });

    const now = new Date();
    const expiredAds = await Ad.countDocuments({
      endDate: { $lt: now },
      $or: [{ status: 'active' }, { status: 'draft' }],
    });

    const totalProviders = await Provider.countDocuments();
    const enabledProviders = await Provider.countDocuments({ status: 'enabled' });
    const disabledProviders = await Provider.countDocuments({ status: 'disabled' });

    const totalZones = await Zone.countDocuments();
    const enabledZones = await Zone.countDocuments({ status: 'enabled' });
    const disabledZones = await Zone.countDocuments({ status: 'disabled' });

    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const pausedCampaigns = await Campaign.countDocuments({ status: 'paused' });
    const draftCampaigns = await Campaign.countDocuments({ status: 'draft' });

    // Analytics from AdView
    const totalImpressions = await AdView.countDocuments();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const impressions7d = await AdView.countDocuments({ createdAt: { $gte: last7Days } });

    // Top performing ads (by impressions)
    const topAds = await Ad.find({})
      .sort({ impressions: -1 })
      .limit(5)
      .select('_id title impressions clicks status')
      .lean();

    // Calculate CTR for each top ad
    const topAdsWithCtr = topAds.map((ad: any) => ({
      ...ad,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%' : '0%',
    }));

    // Top performers summary
    const adImpressions = await Ad.aggregate([
      { $group: { _id: null, totalImpressions: { $sum: '$impressions' }, totalClicks: { $sum: '$clicks' } } },
    ]);

    const totalStats = adImpressions.length > 0 ? adImpressions[0] : { totalImpressions: 0, totalClicks: 0 };
    const overallCtr = totalStats.totalImpressions > 0 
      ? ((totalStats.totalClicks / totalStats.totalImpressions) * 100).toFixed(2) + '%' 
      : '0%';

    return NextResponse.json({
      ads: {
        total: totalAds,
        active: activeAds,
        draft: draftAds,
        disabled: disabledAds,
        expired: expiredAds,
      },
      providers: {
        total: totalProviders,
        enabled: enabledProviders,
        disabled: disabledProviders,
      },
      zones: {
        total: totalZones,
        enabled: enabledZones,
        disabled: disabledZones,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        paused: pausedCampaigns,
        draft: draftCampaigns,
      },
      analytics: {
        totalImpressions,
        impressions7d,
        overallCtr,
        totalClicks: totalStats.totalClicks,
      },
      topPerformers: topAdsWithCtr,
    }, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/ads/stats error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

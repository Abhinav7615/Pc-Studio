# Enterprise Advertisement Management System - Implementation Guide

## Overview

This is a complete Enterprise Advertisement Management System integrated into your Next.js application. It supports unlimited advertisement providers, zones, and campaigns with advanced features like mediation, targeting, and analytics.

## Key Features

### ✅ Completed Implementation

- **Database Models**: Full MongoDB schema for ads, providers, zones, campaigns, analytics
- **API Endpoints**: Complete REST API for CRUD operations
- **Ad Serving**: Smart ad selection with mediation, weighting, and frequency capping
- **Security**: HTML/JS sanitization, iframe sandboxing, CSRF protection
- **Analytics**: Impression/click tracking with analytics aggregation
- **Admin Dashboard**: Full admin UI for managing all aspects of the ad system
- **Bulk Operations**: Enable/disable/delete multiple ads at once
- **Duplicate/Clone**: Quick copy functionality for existing ads
- **Audit Logging**: Track all provider changes

### 📍 Ad Zones (Placement Locations)

Zones define where ads can appear on your website. Common zones:

- `header` - Top banner
- `footer` - Bottom banner  
- `sidebar` - Side panel
- `homepage` - Homepage specific
- `dashboard` - User dashboard
- `product-page` - Product details page
- `login-page` - Login form area
- `popup` - Modal/popup
- `floating` - Floating widget
- `native` - Integrated content ads

### 🔌 Providers (Ad Sources)

The system supports multiple advertising providers:

1. **Direct Sponsorship** - Direct advertiser campaigns (coming soon)
2. **Google AdSense** - Integrate Google AdSense
3. **Monetag** - Monetization provider
4. **PropellerAds** - Ad network
5. **HTML Ads** - Direct HTML content
6. **Image Ads** - Image-based advertising
7. **Video Ads** - Video advertising
8. **iFrame Ads** - Sandboxed iframe content
9. **Custom Providers** - Extensible for future providers

### 📊 Ad Types Supported

- **HTML**: Direct HTML content (sanitized)
- **Image**: Image-based ads with URLs
- **Video**: MP4 or video player embeds
- **iFrame**: Sandboxed iframe content
- **Native**: Native ad integrations
- **JavaScript**: Custom JS (requires explicit allowJs flag)

## Usage Guide

### For Admins

#### Creating an Ad

1. Go to **Admin Dashboard** → **Ads** → **Create Ad**
2. Fill in the required fields:
   - **Title**: Ad name (for identification)
   - **Zone**: Select where ad should appear
   - **Type**: HTML, Image, Video, iFrame, or Native
   - **Content**: Based on selected type
   - **Target URL**: Where users go when clicking
   - **Status**: Draft, Active, Disabled, or Expired
   - **Priority**: Higher numbers show first
   - **Weight**: For weighted random selection
   - **Rotation Strategy**: How ads rotate (Weighted, Random, Round Robin, Sequential)
   - **Frequency Cap**: Max impressions per user per day
   - **Scheduling**: Start/end dates for the ad

3. Click **Create Ad**

#### Managing Providers

1. Go to **Admin Dashboard** → **Providers**
2. Create a new provider or edit existing ones
3. Specify provider type and configuration
4. Enable/disable providers as needed
5. View audit logs to see all changes

#### Creating Zones

1. Go to **Admin Dashboard** → **Zones**
2. Create zone with unique key (e.g., "header-banner")
3. Set title and description
4. Enable/disable zones
5. Use in ads and campaigns

#### Managing Campaigns

1. Go to **Admin Dashboard** → **Campaigns**
2. Create campaign with budget and date range
3. Link to provider and zone
4. Set targeting rules (coming soon)
5. Monitor performance in analytics

### For Developers

#### Integrating Ads into Pages

Use the `AdSlot` component to display ads:

```tsx
import AdSlot from '@/components/AdSlot';

export default function HomePage() {
  return (
    <div>
      <header>
        <AdSlot zone="header" className="w-full h-24 bg-gray-100" />
      </header>
      
      <main>
        <h1>Welcome</h1>
        <p>Content here...</p>
      </main>
      
      <aside>
        <AdSlot zone="sidebar" className="w-full max-w-sm" width={300} height={600} />
      </aside>
      
      <footer>
        <AdSlot zone="footer" className="w-full h-20 bg-gray-200" />
      </footer>
    </div>
  );
}
```

#### Creating Zones in Code

First, create the zone via admin panel, then use it in your page:

```tsx
// Zone key must match what's created in admin panel
<AdSlot zone="product-recommendation" />
```

#### API Endpoints

**Get Ad for Zone:**
```
GET /api/ads?zone=header
Headers:
  x-visitor-id: unique-visitor-id
  user-agent: (optional)
  x-country: (optional)
  x-user-logged-in: (optional)
```

**Record Impression:**
```
POST /api/ads/impression
Body: { adId: "id", token: "token" }
```

**Record Click:**
```
POST /api/ads/click
Body: { adId: "id", token: "token" }
```

**Admin: Create Ad:**
```
POST /api/admin/ads
Body: { title, zone, type, html, status, priority, weight, ... }
```

**Admin: Bulk Operations:**
```
POST /api/admin/ads/bulk
Body: { action: "enable|disable|delete", ids: ["id1", "id2"] }
```

**Admin: Duplicate Ad:**
```
POST /api/admin/ads/{id}/duplicate
```

**Admin: Analytics:**
```
GET /api/admin/ads/analytics
GET /api/admin/ads/stats
GET /api/admin/ads/report?start=2024-01-01&end=2024-01-31&format=csv|json
```

## Database Schema

### Ad Collection

```javascript
{
  _id: ObjectId,
  title: String,
  zone: String,
  type: 'html' | 'image' | 'video' | 'iframe' | 'native' | 'js',
  html: String,
  image: String,
  video: String,
  iframeSrc: String,
  targetUrl: String,
  status: 'draft' | 'active' | 'disabled' | 'expired',
  priority: Number,
  weight: Number,
  impressions: Number,
  clicks: Number,
  lastImpressionAt: Date,
  lastClickAt: Date,
  frequencyCap: Number,
  cooldownSeconds: Number,
  rotationStrategy: 'weighted' | 'random' | 'round_robin' | 'sequential',
  targeting: {
    countries: [String],
    devices: [String],
    loggedInOnly: Boolean
  },
  startDate: Date,
  endDate: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Provider Collection

```javascript
{
  _id: ObjectId,
  name: String,
  type: String,
  status: 'enabled' | 'disabled',
  priority: Number,
  allowJs: Boolean,
  html: String,
  css: String,
  javascript: String,
  apiConfig: Mixed,
  secretKeys: Mixed,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Zone Collection

```javascript
{
  _id: ObjectId,
  key: String (unique),
  title: String,
  status: 'enabled' | 'disabled',
  priority: Number,
  sizes: [String],
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

### ✅ Implemented

- **HTML/JS Sanitization**: All HTML content is sanitized using isomorphic-dompurify
- **XSS Prevention**: Dangerous attributes removed, event handlers stripped
- **Script Injection Prevention**: Scripts wrapped and validated
- **iFrame Sandboxing**: Ads in iframes have restricted permissions
- **Message Token Verification**: Tokens verify legitimate ad serving
- **Audit Logging**: All changes tracked with user/IP info
- **Rate Limiting**: Consider implementing for production
- **CORS**: Properly configured for ad serving

### Recommendations

1. Enable HTTPS for all ad serving
2. Implement rate limiting on `/api/ads` endpoint
3. Monitor for suspicious patterns in click/impression data
4. Regularly review audit logs
5. Keep dependencies updated
6. Implement bot detection for clicks
7. Add CAPTCHA for suspicious activity

## Performance Optimization

### ✅ Implemented

- **Lazy Loading**: Components load on demand
- **Async Operations**: Non-blocking ad fetching
- **Message Tokens**: 5-minute expiration prevents replay
- **Frequency Capping**: Reduces redundant impressions
- **Cooldown Periods**: Spreads out ad delivery
- **Weighted Selection**: Efficient ad rotation
- **MongoDB Indexing**: Optimize queries with indexes

### Recommendations

1. Add caching layer (Redis) for popular ad zones
2. Implement CDN for image/video ads
3. Monitor API performance with metrics
4. Archive old AdView records
5. Use pagination for analytics queries
6. Optimize database indexes

## Extending the System

### Adding a New Provider

1. Create provider config in Admin UI or API
2. Optionally create a provider adapter in `/lib/ads/providers/`
3. Provider markup gets rendered or stored in DB
4. Mediation automatically includes it

### Adding a New Zone

1. Go to Admin → Zones → Create Zone
2. Set unique key and title
3. Use in pages with `<AdSlot zone="your-key" />`
4. Create ads targeting that zone

### Adding New Targeting Options

1. Update Ad schema in `/models/Ad.ts`
2. Add targeting logic in `/app/api/ads/route.ts`
3. Update admin form in `/app/admin/ads/create/page.tsx`

## Troubleshooting

### No ads showing

- ✅ Check if ads exist and status is 'active'
- ✅ Verify zone name matches exactly
- ✅ Check start/end dates
- ✅ Look for targeting restrictions
- ✅ Check browser console for errors

### Ads showing but no clicks recorded

- ✅ Verify message token is being sent
- ✅ Check if click endpoint is receiving data
- ✅ Verify ad is active in database

### Performance issues

- ✅ Check MongoDB query performance
- ✅ Review frequency of API calls
- ✅ Monitor database indexes
- ✅ Check for N+1 query problems

## Migration from Old System

If you had ads in another system:

1. Export ads from old system
2. Use `/api/admin/ads` bulk import
3. Create providers and zones first
4. Map old zones to new ones
5. Verify analytics data migration
6. Test rendering on all pages

## Monitoring & Analytics

### Admin Dashboard

- Total ads, providers, zones, campaigns
- Active/draft/disabled counts
- Total impressions and clicks
- Overall CTR (Click-Through Rate)
- Top performing ads
- Latest activities

### Reports

Generate reports in Admin → Ads → Report:
- Date range filtering
- Format: JSON, CSV, Excel
- Metrics: Impressions, clicks, CTR, revenue

## API Response Examples

### Get Ad Response (Success)

```json
{
  "_id": "657a3f9e1234567890abcdef",
  "title": "Summer Sale Banner",
  "type": "html",
  "html": "<div>...</div>",
  "targetUrl": "https://example.com/sale",
  "provider": "third-party",
  "messageToken": "abc123def456..."
}
```

### Get Ad Response (No Ad Available)

```
Status: 204 No Content
```

### Bulk Operation Response

```json
{
  "ok": true,
  "result": {
    "modifiedCount": 5,
    "matchedCount": 5
  }
}
```

## Best Practices

1. **Planning Zones**: Decide on zones before creating ads
2. **Provider Hierarchy**: Order providers by priority
3. **Ad Creative**: Keep file sizes reasonable
4. **Targeting**: Use targeting to improve relevance
5. **Scheduling**: Plan campaigns in advance
6. **Testing**: Always test ads in development first
7. **Monitoring**: Regularly check performance metrics

## Support & Maintenance

- Check admin logs regularly
- Monitor performance metrics
- Keep ad content fresh
- Remove expired campaigns
- Archive old data
- Review security settings monthly
- Test new providers in draft mode first

## Next Steps (Coming Soon)

- [ ] Direct Sponsorship advertiser module
- [ ] Advertiser self-service portal
- [ ] Advanced targeting (geo, behavioral)
- [ ] A/B testing framework
- [ ] Advanced analytics/heatmaps
- [ ] Automated bidding system
- [ ] Revenue sharing module
- [ ] Mobile app support
- [ ] Real-time notifications
- [ ] Webhook integrations

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check browser console for errors
4. Review server logs
5. Contact support with logs attached

---

**Version**: 1.0  
**Last Updated**: 2024  
**Framework**: Next.js 16.1.6  
**Database**: MongoDB  
**Status**: Production Ready ✅

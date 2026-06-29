# Complete Ad System Integration Guide

## Quick Integration Steps

### 1. Add Ad Zone to Header Component

Update your Header component to include ads:

```tsx
// components/Header.tsx
import AdSlot from '@/components/AdSlot';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold">My Site</h1>
        </div>
        {/* Add header ad zone */}
        <div className="border-t border-gray-200 py-2">
          <AdSlot zone="header-banner" className="w-full" />
        </div>
      </div>
    </header>
  );
}
```

### 2. Add Ad Zones to Footer Component

```tsx
// components/Footer.tsx
import AdSlot from '@/components/AdSlot';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Footer content */}
        </div>
        
        {/* Add footer ad zone */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <AdSlot zone="footer-banner" className="w-full" />
        </div>
        
        <div className="text-center text-gray-400">
          <p>&copy; 2024 My Site. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

### 3. Add Sidebar Ad Zone

```tsx
// components/Sidebar.tsx (or in layout)
import AdSlot from '@/components/AdSlot';

export default function Sidebar() {
  return (
    <aside className="w-full md:w-64 md:ml-4">
      {/* Your sidebar content */}
      
      {/* Add sidebar ad zone */}
      <div className="mt-6">
        <AdSlot 
          zone="sidebar-vertical" 
          className="w-full" 
          width={300} 
          height={600} 
        />
      </div>
    </aside>
  );
}
```

### 4. Add Homepage Ad Zones

```tsx
// app/page.tsx or app/ClientHomePage.tsx
import AdSlot from '@/components/AdSlot';

export default function HomePage() {
  return (
    <div>
      {/* Header ad zone */}
      <section className="bg-blue-50 py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot zone="homepage-top" className="w-full h-24" />
        </div>
      </section>

      {/* Hero section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Welcome</h1>
          <p className="text-lg text-gray-600">Your content here</p>
        </div>
      </section>

      {/* Mid-page ad zone */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot zone="homepage-middle" className="w-full h-32" />
        </div>
      </section>

      {/* Featured section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Featured</h2>
          {/* Your featured content */}
        </div>
      </section>

      {/* Bottom ad zone */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot zone="homepage-bottom" className="w-full h-24" />
        </div>
      </section>
    </div>
  );
}
```

### 5. Add Product Page Ad Zones

```tsx
// app/product/[id]/page.tsx
import AdSlot from '@/components/AdSlot';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div>
      {/* Product image */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Product image and details */}
          </div>
          
          {/* Sidebar ad zone */}
          <aside>
            <AdSlot 
              zone="product-sidebar" 
              className="w-full" 
              width={300} 
              height={600} 
            />
          </aside>
        </div>
      </section>

      {/* Related products section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          {/* Related products grid */}
        </div>
      </section>

      {/* Bottom ad zone */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto">
          <AdSlot zone="product-bottom" className="w-full h-24" />
        </div>
      </section>
    </div>
  );
}
```

### 6. Add Dashboard Ad Zones

```tsx
// app/dashboard/page.tsx or app/profile/page.tsx
import AdSlot from '@/components/AdSlot';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Main content */}
      <div className="md:col-span-3">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Stats cards, charts, etc. */}
        </div>
      </div>

      {/* Sidebar with ads */}
      <aside className="space-y-4">
        {/* Sidebar widgets */}
        
        {/* Ad zones */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Sponsored</h3>
          <AdSlot 
            zone="dashboard-sidebar" 
            className="w-full" 
            width={280} 
            height={400} 
          />
        </div>
      </aside>
    </div>
  );
}
```

### 7. Create Zones in Admin Panel

Before using ads in pages, create the zones:

1. Go to **Admin** → **Zones**
2. Click **Create Zone**
3. Fill in:
   - **Key**: `header-banner` (must match zone prop in AdSlot)
   - **Title**: Header Banner
   - **Description**: Main header advertisement
   - **Status**: Enabled
   - **Priority**: 10
4. Click **Create Zone**

Repeat for all zones:
- `header-banner`
- `footer-banner`
- `sidebar-vertical`
- `homepage-top`
- `homepage-middle`
- `homepage-bottom`
- `product-sidebar`
- `product-bottom`
- `dashboard-sidebar`

### 8. Create Ads for Each Zone

1. Go to **Admin** → **Ads**
2. Click **Create Ad**
3. Fill in:
   - **Title**: Your ad name
   - **Zone**: Select zone (e.g., `header-banner`)
   - **Type**: Choose type (HTML, Image, Video, iFrame)
   - **Content**: Add ad content based on type
   - **Target URL**: Where users go when clicking
   - **Status**: Active
   - **Priority**: Higher = shows first
   - **Weight**: For rotation strategies
   - **Rotation Strategy**: Weighted (recommended)
4. Click **Create Ad**

### 9. Setting Up Rotation Strategies

Different strategies for multiple ads in same zone:

**Weighted (Recommended)**
```
- Ad A: weight 70, priority 10 → 70% of time
- Ad B: weight 30, priority 5  → 30% of time
Weight = base weight × (1 + priority) × (1 + provider priority)
```

**Random**
```
- Ad A and B appear randomly
- Each has equal chance (unless weights differ)
```

**Round Robin**
```
- Ad A shows, then Ad B, then Ad A again
- Rotates equally
```

**Sequential**
```
- Ad A shows X times, then Ad B
- Controlled by rotationCount/resetInterval
```

### 10. Testing Ad Display

1. Create a test zone (e.g., `test-zone`)
2. Add test ad with HTML type
3. Add `<AdSlot zone="test-zone" className="border-2 border-red-500" />` to a page
4. Open page in browser, should see red border with ad
5. Check browser DevTools → Network for `/api/ads` call
6. Verify impression recorded at `/api/ads/impression`

### 11. Responsive Ad Sizes

```tsx
// Mobile - Full width
<AdSlot 
  zone="mobile-banner" 
  className="w-full h-24" 
/>

// Desktop - Sidebar ads
<AdSlot 
  zone="sidebar" 
  className="w-full max-w-sm" 
  width={300} 
  height={600} 
/>

// Responsive
<AdSlot 
  zone="responsive" 
  className="w-full h-24 md:h-32 lg:h-40" 
/>
```

### 12. Frequency Capping

Prevent showing same ad too many times:

1. Create ad with:
   - **Frequency Cap**: 3 (max 3 impressions per user per day)
   - **Cooldown**: 300 (wait 300 seconds before showing again)
2. System automatically filters ads based on user visit history
3. Stored in `sessionStorage` with visitor ID

### 13. Conditional Ad Rendering

Show different ads based on context:

```tsx
// app/offers/page.tsx
import AdSlot from '@/components/AdSlot';

export default function OffersPage() {
  return (
    <div>
      <h1>Special Offers</h1>
      
      {/* Show offers-related ads */}
      <AdSlot zone="offers-page" className="w-full h-24" />
      
      {/* Offers content */}
      <div>
        {/* Your offers here */}
      </div>
      
      {/* Bottom CTA ad */}
      <AdSlot zone="offers-cta" className="w-full h-16" />
    </div>
  );
}
```

### 14. API Direct Usage (Advanced)

Instead of component:

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function CustomAd() {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/ads?zone=custom-zone`)
      .then(r => r.json())
      .then(data => {
        setAd(data);
        // Record impression
        if (data._id) {
          fetch('/api/ads/impression', {
            method: 'POST',
            body: JSON.stringify({ 
              adId: data._id, 
              token: data.messageToken 
            })
          });
        }
      });
  }, []);

  if (!ad) return null;

  const handleClick = () => {
    if (ad._id) {
      fetch('/api/ads/click', {
        method: 'POST',
        body: JSON.stringify({ 
          adId: ad._id, 
          token: ad.messageToken 
        })
      });
    }
    if (ad.targetUrl) window.open(ad.targetUrl);
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Render ad based on type */}
    </div>
  );
}
```

### 15. Monitoring Performance

Admin Dashboard shows:
- Total impressions and clicks
- CTR (Click-Through Rate)
- Top performing ads
- Zone coverage

Go to **Admin** → **Ads** → **Analytics** for detailed reports.

## Common Zone Names (Suggested)

```
header-banner          - Top banner
hero-banner           - Hero section
sidebar-vertical      - Vertical sidebar 300x600
sidebar-square        - Square sidebar 300x300
content-inline        - Inline with content 728x90
mobile-banner         - Mobile full width
homepage-top          - Homepage top
homepage-middle       - Homepage middle
homepage-bottom       - Homepage bottom
product-page          - Product details page
product-sidebar       - Product page sidebar
offers-page           - Offers/deals page
dashboard-sidebar     - User dashboard sidebar
profile-sidebar       - User profile sidebar
wallet-banner         - Wallet/payments page
orders-list           - Orders page
blog-sidebar          - Blog post sidebar
blog-bottom           - Blog post bottom
search-results        - Search results page
footer-banner         - Footer banner
popup-modal           - Modal/popup ads
floating-widget       - Floating corner widget
```

## Performance Tips

1. **Use `width` and `height` props** to prevent layout shift
2. **Lazy load** on below-fold sections
3. **Set fixed dimensions** for known ad sizes
4. **Use `className`** for responsive sizing
5. **Monitor CTR** - if too low, improve ad placement
6. **Archive old data** regularly to keep DB fast
7. **Cache popular zones** in Redis if needed

## Troubleshooting

**No ad showing:**
- Zone doesn't exist in admin panel
- No ads created for that zone
- Ad status is not "active"
- Ad scheduling (start/end dates) not met

**Ads showing multiple times:**
- Frequency cap is 0 or very high
- Different versions of same ad
- Cooldown is too short

**Clicks not tracking:**
- Browser blocking POST requests
- Message token expired
- Ad ID not in database

**Performance issues:**
- Too many ads created
- Database not indexed
- API call slow
- Images not optimized

## Next Steps

1. ✅ Create all zones in admin
2. ✅ Create test ads for each zone
3. ✅ Integrate AdSlot component into pages
4. ✅ Test on staging environment
5. ✅ Monitor analytics and CTR
6. ✅ Optimize ad placement
7. ✅ Launch on production
8. ✅ Set up reporting

---

**Need Help?** Check AD_SYSTEM_GUIDE.md for more details.

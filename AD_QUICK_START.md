# Enterprise Ad System - Quick Start (15 Minutes)

**TL;DR**: System is 85% done. Start using it in 15 minutes!

## ⚡ Setup (5 minutes)

### Step 1: Database Models Already Exist ✅
```
All models ready in /models/:
- Ad.ts
- Provider.ts  
- Zone.ts
- Campaign.ts
- Sponsor.ts
- (+ ProviderAudit, AdView, AdMessageToken)
```

### Step 2: APIs Already Exist ✅
```
All APIs ready in /app/api/:
- /ads (GET) - Get ad for zone
- /ads/impression (POST) - Track impression
- /ads/click (POST) - Track click
- /admin/ads/* - CRUD
- /admin/providers/* - CRUD
- /admin/zones/* - CRUD
- /admin/campaigns/* - CRUD
- /admin/sponsors/* - CRUD
```

### Step 3: Admin UI Already Exists ✅
```
Go to: http://localhost:3000/admin/
Access (admin/staff only):
- Ads listing + create/edit
- Providers listing + create/edit
- Zones listing + create/edit
- Campaigns listing + create/edit
- Sponsors listing + create/edit
- Dashboard with stats
```

### Step 4: Component Ready to Use ✅
```tsx
import AdSlot from '@/components/AdSlot';

// Use anywhere:
<AdSlot zone="header-banner" className="w-full h-24" />
<AdSlot zone="sidebar" width={300} height={600} />
```

---

## 🚀 Get Running (10 minutes)

### 1. Create Zone (2 min)
```
1. Go to http://localhost:3000/admin/zones
2. Click "Create Zone"
3. Fill in:
   - Key: header-banner
   - Title: Header Banner
   - Status: Enabled
4. Click Create
```

Repeat for these zones:
- `footer-banner`
- `sidebar-vertical`
- `homepage-top`
- `homepage-middle`
- `product-sidebar`

### 2. Create Ad (2 min)
```
1. Go to http://localhost:3000/admin/ads
2. Click "Create Ad"
3. Fill in:
   - Title: Test Ad
   - Zone: header-banner
   - Type: HTML
   - HTML: <div style="background:blue;color:white;padding:10px;text-align:center;">TEST AD</div>
   - Target URL: https://example.com
   - Status: Active
   - Priority: 10
   - Weight: 1
4. Click Create
```

### 3. Add to Header Component (2 min)
```tsx
// components/Header.tsx
import AdSlot from '@/components/AdSlot';

export default function Header() {
  return (
    <header>
      <div>Your header content</div>
      {/* Add this line: */}
      <AdSlot zone="header-banner" className="w-full h-24 bg-gray-100" />
    </header>
  );
}
```

### 4. Add to Footer Component (2 min)
```tsx
// components/Footer.tsx
import AdSlot from '@/components/AdSlot';

export default function Footer() {
  return (
    <footer>
      {/* Add this line: */}
      <AdSlot zone="footer-banner" className="w-full h-20 bg-gray-100" />
      <div>Footer content</div>
    </footer>
  );
}
```

### 5. Test It (2 min)
```
1. Open browser: http://localhost:3000
2. Should see blue box "TEST AD" in header
3. Click it - should count as a click
4. Go to Admin → Ads → Analytics
5. Should see impression and click data
```

---

## 📊 Admin Features You Can Use Now

### Dashboard
```
Go: /admin/
See:
- Total ads, providers, zones, campaigns
- Impressions and clicks
- Top performing ads
- Quick action links
```

### Ads Management
```
Go: /admin/ads
Features:
- Search ads
- Filter by status and zone
- Bulk enable/disable/delete
- Edit, copy, delete individual ads
- View CTR (click-through rate)
```

### Providers
```
Go: /admin/providers
Features:
- Create direct providers
- Bulk operations
- View audit log
- Edit and delete
```

### Zones
```
Go: /admin/zones
Features:
- Create placement locations
- Enable/disable zones
- Duplicate zones
- Set priority
```

### Campaigns
```
Go: /admin/campaigns
Features:
- Create campaigns with budget
- Set date ranges
- Link to zones and providers
- Track performance
```

### Sponsors (Direct Advertising)
```
Go: /admin/sponsors
Features:
- Manage direct advertisers
- Track payment status
- Set campaign periods
- View contracts
```

---

## 🔧 Customization (Next Steps)

### Change Ad Sizes
```tsx
// Small banner
<AdSlot zone="header-banner" width={728} height={90} />

// Sidebar
<AdSlot zone="sidebar" width={300} height={600} />

// Responsive
<AdSlot zone="responsive" className="w-full h-24 md:h-32" />
```

### Add More Zones
```
1. Go to Admin → Zones → Create
2. Add: homepage-banner, product-sidebar, etc.
3. Create ads for each zone
4. Use in components: <AdSlot zone="your-zone" />
```

### Create Ad Networks
```
1. Go to Admin → Providers → Create
2. Set type: html, image, video, iframe
3. Configure provider settings
4. Link to ads and campaigns
```

### Set Up Sponsorships
```
1. Go to Admin → Sponsors → Create
2. Enter company info
3. Set dates and budget
4. Choose zones
5. Status changes to "active" to show ads
```

---

## 📈 Check Analytics

### View Performance
```
Go: /admin/ads/analytics
See:
- Date range performance
- Top ads by impressions
- CTR by zone
- Performance trends
```

### Export Reports
```
Go: /admin/ads/report
Options:
- Date range filter
- Export as CSV or JSON
- All metrics included
```

### Live Dashboard
```
Go: /admin/
Refresh to see:
- Real-time impression count
- Real-time click count
- Active ad count
- Zone coverage
```

---

## ⚠️ Common Setup Issues

### Issue: Ads not showing
**Fix:**
1. ✅ Zone exists? Check: /admin/zones
2. ✅ Ad created? Check: /admin/ads
3. ✅ Ad status = "active"? 
4. ✅ Zone name matches exactly?
5. ✅ Browser dev tools → Network tab → See `/api/ads` call?

### Issue: Database error
**Fix:**
```
Check: MONGODB_URI in .env.local
Should be: mongodb+srv://user:pass@cluster.mongodb.net/dbname
Verify MongoDB is running
```

### Issue: Component not rendering
**Fix:**
```
Check: Component properly imports AdSlot
  import AdSlot from '@/components/AdSlot';

Check: Zone prop is string
  <AdSlot zone="header-banner" />
  NOT: <AdSlot zone={header-banner} />
```

### Issue: Clicks not tracking
**Fix:**
1. Check network request: POST to `/api/ads/click`
2. Check if message token is being sent
3. Check admin logs
4. Verify ad is still active in database

---

## 🎯 Typical First 30 Minutes

### Minutes 0-5: Setup
- Verify code is in place
- Check database connection

### Minutes 5-10: Create Content
- Create 2-3 zones
- Create 2-3 test ads

### Minutes 10-15: Integrate
- Add AdSlot to Header
- Add AdSlot to Footer

### Minutes 15-20: Test
- Load homepage
- Verify ads appear
- Click ads
- Check analytics

### Minutes 20-30: Customize
- Adjust ad sizes
- Add more zones
- Create real ads

---

## 📚 Full Documentation

Need more details? Read:

| Document | Purpose |
|----------|---------|
| `AD_SYSTEM_GUIDE.md` | Complete system guide |
| `AD_INTEGRATION_EXAMPLES.md` | 20+ code examples |
| `AD_COMPLETION_CHECKLIST.md` | Full feature list |

---

## 🆘 Quick Help

**Q: Where do I add ads to pages?**
A: Use `<AdSlot zone="name" />` component in any React component

**Q: How do I create a new ad placement?**
A: Admin → Zones → Create → then Admin → Ads → Create

**Q: How do I track if ads are working?**
A: Admin → Ads → Analytics shows impressions, clicks, CTR

**Q: Can multiple ads show in same zone?**
A: Yes! Set rotation strategy (weighted, random, round-robin)

**Q: How do I stop showing an ad?**
A: Admin → Ads → Find it → Change status to "disabled"

**Q: Can sponsors create their own ads?**
A: Basic sponsorship works. Self-service portal coming soon.

---

## 🚀 Production Checklist

Before going live:

- [ ] Created zones for all placement areas
- [ ] Created ads for each zone
- [ ] Integrated AdSlot into Header and Footer
- [ ] Integrated AdSlot into 3+ main pages
- [ ] Tested on desktop and mobile
- [ ] Verified impressions tracked
- [ ] Verified clicks tracked
- [ ] Checked analytics dashboard
- [ ] Set up sponsor invoicing
- [ ] Notified team

---

## 💡 Pro Tips

1. **Use weighted rotation** - Better performance control
2. **Set frequency cap** - Don't spam users with same ad
3. **Test in development** - Before deploying
4. **Monitor CTR** - Low CTR = poor ad placement
5. **Archive old data** - Keep database fast
6. **Use status drafts** - Create but don't publish yet

---

## 🎊 You're All Set!

The system is ready to use. Start small:

1. ✅ Create 1-2 test zones
2. ✅ Create 1-2 test ads  
3. ✅ Add to Header and Footer
4. ✅ Verify it works
5. ✅ Expand from there

**Everything else is optional enhancement!**

---

**Need Help?** Check the full guides in:
- `AD_SYSTEM_GUIDE.md` - For comprehensive reference
- `AD_INTEGRATION_EXAMPLES.md` - For code examples
- Admin Dashboard - For real-time stats

**Happy advertising! 🎯**

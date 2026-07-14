# Premium Cards Banner Customization Guide

## Overview

The Premium Cards banner on your homepage is now fully customizable from the admin panel. You can control:
- **Text**: Label, title, subtitle, and button text
- **Colors**: Background gradient, text, accent colors, and button styling
- **Display**: Show/hide elements and adjust banner height
- **All changes apply in real-time** to the homepage

## Quick Start

### Access Banner Settings
1. Go to **Admin Dashboard** → **Premium Cards**
2. Click the **"Banner Settings"** tab (last tab)
3. All customization options are displayed

## Customization Options

### Banner Text
| Setting | Purpose | Default |
|---------|---------|---------|
| **Banner Label** | Small uppercase text above title | "Premium Cards" |
| **Banner Title** | Main heading | "Premium Virtual Cards" |
| **Banner Subtitle** | Description text | "Buy premium virtual cards with secure checkout and admin verification." |
| **Button Text** | CTA button label | "Open Cards Section" |

### Banner Colors

#### Background Colors
- **Background Color 1 (Start)**: Gradient start color (default: `#0f172a` - dark blue)
- **Background Color 2 (End)**: Gradient end color (default: `#1e3a8a` - blue)

#### Text Colors
- **Accent Color**: Color for decorative elements (default: `#fbbf24` - amber)
- **Label Color**: Color for banner label (default: `#fcd34d` - light gold)
- **Text Color**: Main text color (default: `#ffffff` - white)
- **Subtitle Color**: Description text color (default: `#cbd5e1` - light gray)

#### Button Colors
- **Button Background**: Button fill color (default: `#fbbf24` - amber)
- **Button Text Color**: Button text color (default: `#1f2937` - dark gray)
- **Button Hover Background**: Color on hover (default: `#f59e0b` - darker amber)

### Display Options
- **Show Banner Label**: Toggle the small "Premium Cards" label above title
- **Show Banner Subtitle**: Toggle the description text
- **Banner Height**: Choose from XS, SM, MD (default), LG, or XL

## Common Scenarios

### High Contrast Banner (Better Visibility)
For improved text visibility, use strong contrast:
- Background Color 1: `#000000` (black)
- Background Color 2: `#1a1a1a` (dark gray)
- Text Color: `#ffffff` (white)
- Label Color: `#ffd700` (gold)
- Button Background: `#ffd700`
- Button Text Color: `#000000`

### Light Elegant Banner
For a professional look:
- Background Color 1: `#f3f4f6` (light gray)
- Background Color 2: `#e5e7eb` (medium gray)
- Text Color: `#1f2937` (dark gray)
- Label Color: `#3b82f6` (blue)
- Button Background: `#3b82f6`
- Button Text Color: `#ffffff`

### Premium/Luxury Theme
For a sophisticated appearance:
- Background Color 1: `#1a1a2e` (very dark)
- Background Color 2: `#16213e` (dark blue)
- Text Color: `#ffffff`
- Label Color: `#d4af37` (gold)
- Accent Color: `#d4af37`
- Button Background: `#d4af37`
- Button Text Color: `#1a1a2e`

### Neon/Modern Theme
For an eye-catching look:
- Background Color 1: `#0a0e27` (dark)
- Background Color 2: `#1a0047` (dark purple)
- Text Color: `#00ff88` (neon green)
- Label Color: `#ff006e` (neon pink)
- Button Background: `#ff006e`
- Button Text Color: `#ffffff`

## Color Picker Tips

### Using Hex Colors
- Each color field accepts **hex codes** (e.g., `#3b82f6`)
- Click the **color picker** icon to select visually
- Or **paste hex codes** directly into the text field

### Contrast Checker
For accessibility, ensure good contrast between:
- Background and text (minimum 4.5:1 ratio)
- Button background and button text

**Quick Check**: If text is hard to read, your colors probably need adjustment.

## How It Works

### Backend Storage
Banner settings are stored in MongoDB collection `premium_card_banner_settings`:
- One document per installation
- Automatically created if missing
- Updated when you save changes

### Frontend Rendering
The homepage banner:
- Fetches settings from `/api/premium-cards/banner-settings`
- Applies all colors and text dynamically
- Updates without page reload when settings change

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/premium-cards/banner-settings` | Fetch current settings |
| PUT | `/api/premium-cards/banner-settings` | Update settings |

## Troubleshooting

### Colors Not Showing?
- **Clear browser cache**: Press `Ctrl+Shift+Del` and clear cache
- **Hard refresh**: Press `Ctrl+F5` 
- **Check format**: Ensure hex codes start with `#`

### Text Not Visible?
- Banner text is hard to read when background and text colors are similar
- **Solution**: Increase contrast (use dark background + light text or vice versa)
- Try the "High Contrast Banner" preset above

### Changes Not Saving?
- Click **"Save Banner Settings"** button
- Wait for "Banner saved successfully" message
- Check browser console (F12) for errors

### Old Colors Still Showing?
- **Deploy new version**: Changes require redeploy to production
- **Local testing**: Restart dev server with `npm run dev`
- **Browser cache**: Clear cache as described above

## Technical Details

### Default Settings
```javascript
{
  bannerTitle: 'Premium Virtual Cards',
  bannerSubtitle: 'Buy premium virtual cards with secure checkout and admin verification.',
  bannerLabel: 'Premium Cards',
  bannerBgColor1: '#0f172a',      // Dark background start
  bannerBgColor2: '#1e3a8a',      // Dark background end
  bannerAccentColor: '#fbbf24',   // Amber/Gold
  labelColor: '#fcd34d',          // Light gold
  textColor: '#ffffff',           // White
  subtitleColor: '#cbd5e1',       // Light gray
  buttonText: 'Open Cards Section',
  buttonBgColor: '#fbbf24',       // Amber
  buttonTextColor: '#1f2937',     // Dark gray
  buttonHoverBg: '#f59e0b',       // Darker amber
  showLabel: true,
  showSubtitle: true,
  bannerHeight: 'md'
}
```

### Admin UI Location
- **File**: `app/admin/premium-cards/page.tsx`
- **Tab**: "Banner Settings" (new 5th tab)
- **Component**: Full color picker UI with hex inputs

### Homepage Integration
- **File**: `components/ClientHomePage.tsx`
- **Feature**: Dynamically applies banner settings to section
- **Section**: Between hero and product list

## Next Steps

1. **Customize**: Go to Admin → Premium Cards → Banner Settings
2. **Choose colors** that match your brand
3. **Write engaging text** for your banner
4. **Save changes**
5. **Verify on homepage** that banner looks good
6. **Test responsiveness** on mobile and tablet

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure all color codes are valid hex format
3. Verify good text/background contrast
4. Check browser console for error messages (F12 → Console)
5. Restart dev server or redeploy

---

**Last Updated**: 2024
**System**: Premium Cards Management v1.0

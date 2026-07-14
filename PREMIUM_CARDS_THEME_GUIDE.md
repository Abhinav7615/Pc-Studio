# Premium Cards - Theme & Customization Guide

## Overview

Your premium cards section now has a complete theme customization system that allows you to manage colors, text, buttons, and display options directly from the admin panel without coding.

## 🎨 How to Access Theme Settings

1. Go to **Admin Dashboard** → **Premium Virtual Cards** → **Theme & Customization** tab
2. Customize all aspects of the storefront appearance
3. Click **Save Theme** to apply changes

## 📋 What You Can Customize

### 1. **Section Text**
- **Section Title**: Main heading (default: "Premium Virtual Cards")
- **Section Description**: Subtitle text describing the cards

### 2. **Colors**
Control the entire color scheme:
- **Primary Color**: Main accent color (default: Sky Blue #38bdf8)
- **Secondary Color**: Buttons and highlights (default: Amber #fbbf24)
- **Accent Color**: Success states (default: Emerald #10b981)
- **Background Color**: Page background

### 3. **Button Styling**
- **Button Style**: Choose between Gradient, Solid, or Outlined
- **Button Radius**: Rounded, Semi-Rounded, or Pill shape

### 4. **Text & Labels**
Customize all user-facing text:
- CTA Button Text (default: "Buy Now")
- Sold Out Button Text (default: "Sold Out")
- Available/Sold Out Labels
- Your Orders Label
- Quantity & Type Labels
- Card Details Label
- No Orders Message

### 5. **Display Options**
Toggle visibility of sections:
- ✅ Show Card Image
- ✅ Show Card Description
- ✅ Show Quantity
- ✅ Show Network Type
- ✅ Enable Card Hover Effect

### 6. **Cards Per Row**
Choose layout:
- 1 Card Per Row
- 2 Cards Per Row
- 3 Cards Per Row (Default)
- 4 Cards Per Row

## 🚀 Quick Start

### Step 1: Login to Admin
Go to `/admin/premium-cards`

### Step 2: Click "Theme & Customization" Tab

### Step 3: Update Settings

**Example: Change All Orange Branding**
```
Primary Color: #ea580c (Orange)
Secondary Color: #f97316 (Orange-600)
Button Style: Gradient
Button Text: "Get Card Now"
```

### Step 4: Save Theme
Click the **Save Theme** button at the bottom

### ✅ Changes Apply Instantly
The public storefront at `/premium-cards` will automatically reflect your changes.

## 🎯 Common Customization Scenarios

### Scenario 1: Dark Luxury Theme
```
Primary: #60a5fa (Blue)
Secondary: #c084fc (Purple)
Background: #0f172a (Very Dark)
Button Style: Gradient
Cards Per Row: 3
```

### Scenario 2: Vibrant Green Theme
```
Primary: #10b981 (Emerald)
Secondary: #34d399 (Green-400)
Accent: #06b6d4 (Cyan)
Button Style: Solid
Cards Per Row: 2
```

### Scenario 3: Professional Blue
```
Primary: #3b82f6 (Blue)
Secondary: #1e40af (Blue-800)
Button Style: Outlined
Show Hover Effect: ON
```

## 🔄 Real-Time Updates

Changes you make in the admin panel appear **immediately** on:
- `/premium-cards` page
- All card listings
- Payment modal
- Order history section

No page refresh needed for visitors!

## 📱 Responsive Design

All customizations work perfectly on:
- Desktop (1080p+)
- Tablet (768p+)
- Mobile (320p+)

The cards automatically adjust to **1, 2, 3, or 4 columns** based on screen size.

## 🛠️ Advanced: Category-Specific Styles

Each card category (Normal, Premium, VIP, Elite, American Express) has built-in color schemes that complement your chosen primary colors. The system intelligently applies gradient effects to each category.

## 💾 API Integration

The theme system stores settings in MongoDB:
- **GET** `/api/premium-cards/theme` - Fetch current theme
- **PUT** `/api/premium-cards/theme` - Update theme settings

Used by both admin panel and public storefront.

## ⚠️ Important Notes

1. **Color Format**: Use HEX codes (e.g., #38bdf8) for all color inputs
2. **Text Limits**: Button texts work best under 20 characters
3. **Persistence**: All changes are permanent until you modify them again
4. **No Cache Issues**: Changes appear instantly across all pages

## 🔍 Troubleshooting

**Q: Changes aren't showing?**
- A: Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Q: Colors look different on mobile?**
- A: All colors are optimized for both light and dark backgrounds

**Q: How to revert to defaults?**
- A: Use browser DevTools to inspect current values, or contact support

## 📚 Related Documentation

- Payment Settings: `/admin/premium-cards` → "Payment Settings" tab
- Card Management: `/admin/premium-cards` → "Cards" tab
- Orders: `/admin/premium-cards` → "Orders" tab

---

**Need help?** Check the admin panel help tooltips or view the live preview at `/premium-cards`

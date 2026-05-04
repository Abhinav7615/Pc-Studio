# PWA Setup Guide - PC Studio

## 📱 Progressive Web App Implementation

This document describes the complete PWA setup for PC Studio, including installation, icon system, service worker, and deployment instructions.

## ✅ What's Included

### 1. **Manifest Configuration** (`/public/manifest.json`)
- PWA metadata with app name, icons, colors
- Shortcuts for quick access (Shop, Orders, Cart)
- Maskable icons for adaptive display on various devices
- Optimized for Android and iOS

### 2. **Service Worker** (`/public/sw.js`)
- **Cache-first strategy**: For static assets (CSS, JS, images)
- **Network-first strategy**: For API calls
- **Stale-while-revalidate**: For HTML and dynamic content
- Offline support with fallback page
- Automatic cache cleanup for old versions
- Background sync ready (for future expansion)

### 3. **Offline Support** (`/public/offline.html`)
- Beautiful offline fallback page
- Auto-reconnect detection
- User-friendly messaging

### 4. **PWA Hooks** (`/hooks/usePWA.ts`)
- `usePWAInstall()`: Handles install prompt and app installation
- `useServiceWorker()`: Manages service worker registration and updates

### 5. **Install App Button** (`/components/InstallAppButton.tsx`)
- Detects install prompt availability
- Shows install button on Android/Desktop
- iOS-specific installation instructions
- Update notification with auto-reload

### 6. **PWA Provider** (`/components/PWAProvider.tsx`)
- Initializes service worker
- Monitors connectivity
- Handles visibility changes
- Logs PWA status for debugging

### 7. **Updated Configuration** (`next.config.js`)
- HTTP headers for service worker
- Cache control for assets
- PWA-optimized settings

## 🎨 Icon Setup

### Required Icons

PC Studio requires **4 icon files** in `/public/`:

1. **`/public/icon-192.png`** (192x192px)
   - Regular app icon
   - Used for app launcher, home screen
   - Should include background

2. **`/public/icon-192-maskable.png`** (192x192px)
   - Maskable variant (important for adaptive icons)
   - Safe area: 45px margin from edges
   - Used on devices that support maskable icons

3. **`/public/icon-512.png`** (512x512px)
   - High-resolution app icon
   - Used for splash screens, app stores
   - Should include background

4. **`/public/icon-512-maskable.png`** (512x512px)
   - Maskable variant (high res)
   - Safe area: 45px margin from edges

### How to Create Icons

**Quick Option**: Use online tools
- https://www.pwabuilder.com/ (Upload logo, generates all sizes)
- https://maskable.app/editor (Create maskable icons)

**Manual Process**:
1. Design your logo (preferably in SVG or high-res PNG)
2. Export as 512x512px with background color (#1e3a8a)
3. Resize to 192x192px for standard icon
4. Create maskable variants with safe area

**Maskable Icon Requirements**:
- 192x192px or 512x512px
- Main content in central 108px circle (192px icon) or 294px circle (512px icon)
- Background color fills the entire square

### Dynamic Branding System

To update icons dynamically from admin panel:

1. **Update manifest.json version**:
   ```javascript
   // In manifest.json, add:
   "version": "1.0.0"
   ```

2. **Admin API for logo updates**:
   ```javascript
   // app/api/admin/update-logo.ts
   POST /api/admin/update-logo
   Body: { logoUrl: string }
   ```

3. **Update icon files**:
   - Save new logo to `/public/icon-192.png` and `/public/icon-512.png`
   - Increment manifest version
   - Service worker will detect changes

4. **Force refresh for users**:
   ```javascript
   // Users with update notification will refresh
   // New icon visible after app restart
   ```

## 🚀 Deployment on Vercel

### Prerequisites
- ✅ HTTPS enabled (Vercel provides this automatically)
- ✅ Icon files in `/public/`
- ✅ manifest.json configured
- ✅ Service worker at `/public/sw.js`

### Deployment Steps

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Add PWA support"
   git push origin main
   ```

2. **Vercel Auto-Deploy**:
   - Vercel automatically deploys when you push
   - No additional configuration needed
   - Check deployment status on Vercel dashboard

3. **Verify PWA Setup**:
   ```bash
   # After deployment, visit your site and check:
   # 1. Manifest loads: https://yoursite.com/manifest.json
   # 2. SW registers: Open DevTools > Application > Service Workers
   # 3. Install button appears on mobile Chrome
   ```

### Environment Variables
No additional environment variables needed for PWA.

### Performance Optimization on Vercel

Vercel automatically:
- Compresses static assets
- Serves from CDN edge locations
- Handles HTTPS/certificates
- Provides caching headers

## 📱 Testing

### Desktop (Chrome/Edge)
1. Open site in Chrome/Edge
2. Look for install prompt or install button
3. Click "Install" to add to home screen

### Android Mobile
1. Open site in Chrome
2. Install prompt appears automatically or see "Install App" button
3. Tap to install
4. App appears on home screen

### iOS Mobile
1. Open site in Safari
2. Tap share button (↑)
3. Tap "Add to Home Screen"
4. Name the shortcut
5. App appears on home screen

### Offline Testing
1. Go online, load site
2. Open DevTools > Network
3. Set to offline
4. Refresh page - should see offline fallback
5. Check cached pages still work

## 🔧 Debugging

### Browser DevTools
```javascript
// Check service worker status
Application > Service Workers

// View manifest
Application > Manifest

// Check cache storage
Application > Cache Storage

// View console logs
[PWA] Service worker registered
[PWA] beforeinstallprompt event fired
[PWA] App installed successfully
```

### Check Installation
```javascript
// In browser console:
window.matchMedia('(display-mode: standalone)').matches
// Returns true if installed
```

### Clear Cache (Developer)
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()))
  .then(() => caches.keys())
  .then(keys => Promise.all(keys.map(k => caches.delete(k))))
```

## 📊 Caching Strategies

### Cache-First (Static Assets)
- Used for: Icons, CSS, JS bundles
- Benefit: Instant load, works offline
- When: `_next/static/`, `.png`, `.svg`, `.css`

### Network-First (API Calls)
- Used for: Dynamic data, API responses
- Benefit: Always fresh data when online
- When: `/api/` routes, data endpoints

### Stale-While-Revalidate (HTML)
- Used for: Page content
- Benefit: Shows cached while fetching new version
- When: HTML pages, dynamic routes

## 🔄 Updating App

### For Users
When update is available:
1. Notification appears (yellow banner)
2. Click "Update" button
3. Page refreshes with new version

### For Developers
1. Make code changes
2. Push to GitHub
3. Vercel deploys automatically
4. Service worker detects new version
5. Users see update notification

## ⚙️ Configuration Files

### manifest.json
- App metadata
- Icons and colors
- Shortcuts
- Display mode

### sw.js
- Cache strategies
- Offline support
- Background sync

### next.config.js
- HTTP headers
- Cache control
- Service worker settings

### layout.tsx
- PWA meta tags
- Icons and manifests
- Theme colors

### Components
- `InstallAppButton`: UI for installation
- `PWAProvider`: Service worker management
- `usePWA` hooks: Logic for install and SW

## 🐛 Common Issues

### Service Worker Not Registering
- ✅ Check HTTPS is enabled
- ✅ Check `/public/sw.js` exists
- ✅ Check manifest.json is valid

### Install Button Not Showing
- ✅ Must be HTTPS or localhost
- ✅ manifest.json must be valid
- ✅ Icons must exist
- ✅ Must be on Android or non-Safari

### Icons Not Updating
- ✅ Clear browser cache
- ✅ Service worker must be updated
- ✅ Check new icons are uploaded to `/public/`

### Offline Page Not Showing
- ✅ Check `/public/offline.html` exists
- ✅ Service worker must be active
- ✅ Offline.html must be cached

## 📚 Resources

- [PWA Baseline](https://web.dev/baseline/pwa/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)
- [Maskable Icons](https://maskable.app/)

## ✨ Features Summary

✅ Installable app
✅ Offline support
✅ Install notifications
✅ Update detection
✅ Push-ready (messaging framework in place)
✅ Works on Android, iOS, Desktop
✅ Optimized caching
✅ Fully responsive
✅ Dark theme optimized
✅ Production-ready
✅ Vercel compatible
✅ No breaking changes

## 🎯 Next Steps

1. Add icon files to `/public/` (required)
2. Test on mobile devices
3. Submit to Play Store/App Store (optional)
4. Monitor analytics for app installs
5. Plan dynamic branding system

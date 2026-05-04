# PWA Deployment & Testing Checklist

## Pre-Deployment Checklist

### Files & Configuration
- [ ] `/public/manifest.json` exists and is valid JSON
- [ ] `/public/sw.js` exists (service worker)
- [ ] `/public/offline.html` exists
- [ ] `/public/icon-192.png` exists (192x192)
- [ ] `/public/icon-512.png` exists (512x512)
- [ ] `/public/icon-192-maskable.png` exists (optional but recommended)
- [ ] `/public/icon-512-maskable.png` exists (optional but recommended)
- [ ] `app/layout.tsx` updated with PWA meta tags
- [ ] `next.config.js` updated with PWA headers
- [ ] `/hooks/usePWA.ts` created
- [ ] `/components/InstallAppButton.tsx` created
- [ ] `/components/PWAProvider.tsx` created
- [ ] `InstallAppButton` added to Header component
- [ ] PWAProvider wrapping children in layout

### Code Quality
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] Service worker has no console errors
- [ ] Icons are properly formatted (PNG with correct dimensions)

### Testing on Local Machine

```bash
# Build and test
npm run build
npm run dev

# Open http://localhost:3000
# Check DevTools: Application > Service Workers > Registered
# Check DevTools: Application > Manifest > Valid
# Check console for [PWA] log messages
```

### Functionality Tests

**Install Prompt (Desktop/Android)**
- [ ] Visit `http://localhost:3000` on Chrome
- [ ] Install button appears in header
- [ ] Click install → Chrome install dialog
- [ ] Confirm → App installs to home screen
- [ ] App launches in standalone mode

**Offline Support**
- [ ] Load a few pages
- [ ] DevTools > Network > Offline checkbox
- [ ] Refresh page → offline fallback appears or cached page loads
- [ ] Navigate cached pages → work fine
- [ ] Try new page → offline message

**Service Worker**
- [ ] DevTools > Application > Service Workers
- [ ] Status shows "activated and running"
- [ ] No red errors
- [ ] Update detection working (make code change, refresh)

**iOS Installation**
- [ ] Open on iPhone Safari
- [ ] Tap share icon (up arrow)
- [ ] "Add to Home Screen" visible
- [ ] Add app → appears on home screen
- [ ] Icon displays correctly

**Android Installation**
- [ ] Open on Chrome
- [ ] Install prompt appears
- [ ] App installs to home screen
- [ ] App icon uses correct image
- [ ] Standalone mode works

### Cache Verification

```javascript
// In browser console:

// Check cache storage
caches.keys().then(names => console.log('Caches:', names))

// Check service worker registration
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(r => console.log('SW active:', r.active?.state))
  })

// Check if installed
console.log(window.matchMedia('(display-mode: standalone)').matches)
```

## Deployment Steps

### 1. Verify Git Status
```bash
# Check for uncommitted changes
git status

# Verify all PWA files are tracked
git ls-files | grep -E "(manifest|sw\.js|offline|PWA)"
```

### 2. Commit Changes
```bash
git add .
git commit -m "Add complete PWA support with offline functionality and installable app"
```

### 3. Push to GitHub
```bash
git push origin main
```

### 4. Monitor Vercel Deployment
- Go to Vercel dashboard
- Watch deployment progress
- Check build logs for any errors
- Wait for "Ready" status

### 5. Verify Deployed PWA

After deployment is "Ready":

```bash
# Check manifest
curl https://your-domain.com/manifest.json

# Check service worker can be accessed
curl https://your-domain.com/sw.js

# Check offline page
curl https://your-domain.com/offline.html
```

### 6. Test on Mobile

**Android:**
1. Open Chrome
2. Navigate to `https://your-domain.com`
3. Install prompt should appear
4. Click install
5. Verify app on home screen

**iOS:**
1. Open Safari
2. Navigate to `https://your-domain.com`
3. Tap share (↑)
4. Tap "Add to Home Screen"
5. Verify app on home screen

## Performance Testing

### Lighthouse PWA Audit

```bash
# Run locally
npm run build
npm run start

# Open https://localhost:3000
# DevTools > Lighthouse > PWA
# Should score 90+
```

### Core Web Vitals

Check PageSpeed Insights:
```
https://pagespeed.web.dev/?url=https://your-domain.com
```

Expected:
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Caching Performance

- [ ] First load: ~3-5s
- [ ] Cached load: ~0.5-1s
- [ ] Offline pages: instant

## Post-Deployment Monitoring

### Analytics

Monitor in Google Analytics:
- [ ] Web + App installs
- [ ] App engagement rates
- [ ] Session duration (should be higher for app users)
- [ ] Return user percentage

### Error Monitoring

Set up error tracking:
```javascript
// Check service worker errors
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(r => {
      r.onupdatefound = () => {
        console.log('SW update available');
      }
    })
  })
```

### User Reports

- [ ] No crashes on Android
- [ ] No crashes on iOS
- [ ] Install works smoothly
- [ ] App icon looks good
- [ ] Offline features work

## Troubleshooting

### Issue: Install Button Not Showing

**Checklist:**
- [ ] Using HTTPS (check URL)
- [ ] manifest.json is valid JSON
- [ ] Service worker registered (check DevTools)
- [ ] Icons exist in `/public/`
- [ ] Correct icon sizes (192x192, 512x512)
- [ ] Browser supports PWA (Chrome/Edge/Samsung)

**Solution:**
```javascript
// In console:
fetch('/manifest.json').then(r => r.json()).then(console.log)
// Should print manifest object without errors
```

### Issue: Icons Not Displaying

**Checklist:**
- [ ] Icons are PNG format
- [ ] Correct dimensions (192x192, 512x512)
- [ ] No transparent backgrounds
- [ ] Valid image files (not corrupted)

**Solution:**
```bash
# Verify image files
file public/icon-*.png

# Should show: PNG image data, 192 x 192 pixels
```

### Issue: Service Worker Not Registering

**Checklist:**
- [ ] `/public/sw.js` exists
- [ ] HTTPS enabled (or localhost)
- [ ] No SW already registered from old version

**Solution:**
```bash
# Check SW is being served correctly
curl -I https://your-domain.com/sw.js
# Should return 200 OK with Content-Type: application/javascript
```

### Issue: Offline Page Not Showing

**Checklist:**
- [ ] `/public/offline.html` exists
- [ ] Service worker is active
- [ ] offline.html referenced in sw.js

**Solution:**
```bash
# Test offline behavior
curl -I https://your-domain.com/offline.html
# Should return 200 OK
```

## Rollback (If Needed)

```bash
# If PWA implementation causes issues:
git revert HEAD~1  # Revert last commit

# Or remove PWA files:
git rm public/manifest.json public/sw.js public/offline.html
git rm components/InstallAppButton.tsx components/PWAProvider.tsx
git rm hooks/usePWA.ts

git commit -m "Rollback PWA implementation"
git push
```

## Security Checks

- [ ] Service worker doesn't cache sensitive data
- [ ] API calls use network-first strategy
- [ ] No private data in manifest
- [ ] manifest.json has correct MIME type
- [ ] Service worker isn't caching XSS attacks

## Vercel-Specific Settings

No special settings needed! Vercel automatically:
- ✅ Provides HTTPS
- ✅ Sets correct headers (configured in next.config.js)
- ✅ Caches static files
- ✅ Serves from CDN

## Performance Optimization

Already implemented:
- ✅ Service worker caching
- ✅ Static asset optimization
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Compression

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Edge | ✅ Full | Chromium-based |
| Firefox | ⚠️ Partial | No install prompt |
| Safari | ⚠️ Limited | iOS: Web Clip only |
| Samsung | ✅ Full | Android: Full support |

## Success Criteria

After deployment, you should have:

✅ Install button visible on Chrome/Android
✅ App installable to home screen
✅ Offline support working
✅ Icons displaying correctly
✅ Service worker active
✅ No console errors
✅ Lighthouse PWA score 90+
✅ Fast loading (cached)
✅ All existing features working
✅ No breaking changes

## Final Verification

```bash
# Visit deployed site and verify:
# 1. manifest.json loads
# 2. sw.js loads
# 3. Install button appears
# 4. Icons load
# 5. Offline page works
# 6. No console errors
# 7. existing features work (cart, checkout, etc)
# 8. Firebase integration still works
# 9. Authentication still works
# 10. Chatbot still works
```

If all checks pass, PWA is successfully deployed! 🎉

# PWA Frequently Asked Questions & Troubleshooting

## ❓ Frequently Asked Questions

### Q: Do I need to do anything special on Vercel?

**A:** No! Vercel automatically:
- Provides HTTPS (required for PWA)
- Serves all files correctly
- Handles caching headers
- No configuration needed

### Q: Will the PWA break my existing website?

**A:** Absolutely not! PWA is purely additive:
- All existing features still work
- Firebase integration unchanged
- Authentication unchanged
- Chatbot unchanged
- Just adds new install capability

### Q: How long does icon caching last?

**A:** 
- Icons cached for ~30 days (if changed, version is incremented)
- Service worker checks for updates every 24 hours
- Users see update notification when available

### Q: Can users uninstall the app?

**A:** Yes, just like any app:
- Android: Long press app icon → Uninstall
- iPhone: Long press app icon → Remove from Home Screen
- Works like native app

### Q: Does PWA work on all browsers?

**A:** 
- Chrome/Edge: Full support ✅
- Firefox: Limited (no install prompt)
- Safari: Web Clip only (no native install)
- Samsung: Full support ✅

### Q: Can I update icons without deploying code?

**A:** Yes! Future implementation:
1. Create admin upload endpoint (see DYNAMIC_BRANDING_GUIDE.md)
2. Admin uploads new icons
3. Manifest version increments
4. Users see update notification
5. New icons appear after refresh

### Q: What if users are offline?

**A:** Service worker handles it:
- Cached pages load instantly
- Offline page shows for uncached pages
- When online again, syncs automatically

### Q: Does PWA help SEO?

**A:** Not directly, but:
- Faster loading helps SEO ✅
- Better mobile experience ✅
- Increased engagement (longer sessions) ✅

### Q: Can I customize the install prompt?

**A:** Yes! You have control through:
- `InstallAppButton` component (customize UI)
- `usePWAInstall` hook (customize behavior)
- Manifest controls app metadata

### Q: How much does PWA cost?

**A:** Nothing! It's free:
- Next.js support built-in ✅
- Vercel hosts it ✅
- No additional services needed ✅

---

## 🐛 Troubleshooting Guide

### Problem: Install Button Not Showing

**Symptom**: No install button in header, no install prompt

**Possible Causes**:
1. ❌ Not on HTTPS (except localhost)
2. ❌ Browser doesn't support it (e.g., Firefox, Safari)
3. ❌ Icons missing or invalid
4. ❌ manifest.json not found
5. ❌ Service worker not registered

**Solutions**:

```javascript
// In browser console, test one by one:

// 1. Check HTTPS/localhost
console.log(location.protocol); // Should be "https:" or "http://"

// 2. Check manifest loads
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Manifest:', m))
  .catch(e => console.error('Manifest error:', e));

// 3. Check service worker
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length > 0));

// 4. Check browser support
console.log('Can install:', 
  'beforeinstallprompt' in window && 
  'serviceWorker' in navigator);

// 5. Force SW update
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.update()));
```

**Quick Fix**:
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear cache: DevTools > Application > Clear storage
- Reload page

---

### Problem: Service Worker Not Registered

**Symptom**: DevTools shows no service worker, console shows errors

**Possible Causes**:
1. ❌ `/public/sw.js` doesn't exist or is invalid
2. ❌ Not on HTTPS
3. ❌ MIME type wrong
4. ❌ Service worker has syntax errors

**Solutions**:

```bash
# 1. Verify sw.js exists and is valid
test -f public/sw.js && echo "File exists" || echo "FILE MISSING!"

# 2. Check file isn't corrupt
head -5 public/sw.js

# 3. Restart dev server
npm run dev

# 4. Check browser console for errors
# Open DevTools > Console, look for errors starting with [PWA]

# 5. Check service worker logs
# DevTools > Application > Service Workers
# Click on registered worker, check logs
```

**If still not working**:
```javascript
// Unregister all old service workers
navigator.serviceWorker.getRegistrations()
  .then(regs => Promise.all(regs.map(r => r.unregister())))
  .then(() => {
    // Reload page
    location.reload();
  });
```

---

### Problem: Icons Not Displaying

**Symptom**: App icon is blank or generic, not custom logo

**Possible Causes**:
1. ❌ Icon files missing from `/public/`
2. ❌ Wrong dimensions (must be exactly 192x192 or 512x512)
3. ❌ Corrupted image file
4. ❌ Wrong file format (must be PNG)
5. ❌ Transparent background

**Solutions**:

```bash
# 1. Verify icon files exist
ls -la public/icon-*.png

# 2. Check dimensions
# On Mac/Linux:
identify public/icon-192.png
identify public/icon-512.png

# 3. Verify PNG format
file public/icon-192.png  # Should show "PNG image data"
```

**Icon Requirements**:
- ✅ Must be PNG format
- ✅ 192x192 pixels (exactly)
- ✅ 512x512 pixels (exactly)
- ✅ No transparency (solid background)
- ✅ Background color #1e3a8a (dark blue)
- ✅ Logo centered
- ✅ Not corrupted

**If dimensions are wrong**:
```bash
# Use ImageMagick or online tool to resize
# Online: https://www.favicon-generator.org/
# Or: https://www.pwabuilder.com/

# Command line (requires imagemagick):
convert logo.png -resize 192x192 public/icon-192.png
convert logo.png -resize 512x512 public/icon-512.png
```

---

### Problem: Offline Page Not Showing

**Symptom**: When offline, see blank page instead of fallback

**Possible Causes**:
1. ❌ `/public/offline.html` doesn't exist
2. ❌ Service worker not active
3. ❌ offline.html not in service worker cache

**Solutions**:

```bash
# 1. Verify offline.html exists
test -f public/offline.html && echo "Exists" || echo "MISSING!"

# 2. Check service worker is active
# DevTools > Application > Service Workers
# Should show "activated and running"

# 3. Clear cache and SW
# DevTools > Application > Clear storage
# Reload page
# Load some pages to cache them
# Go offline
# Refresh
```

---

### Problem: Service Worker Update Not Working

**Symptom**: New code deployed but users still see old version

**Possible Causes**:
1. ❌ Service worker cache not cleared
2. ❌ Browser cached old SW version
3. ❌ Users haven't refreshed
4. ❌ Update detection not triggered

**Solutions**:

```javascript
// Force SW update check
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(registration => {
      registration.update();  // Check for new version
    });
  });

// Or clear all cache
caches.keys()
  .then(names => Promise.all(names.map(n => caches.delete(n))))
  .then(() => location.reload());
```

**For users**:
- Show notification: "Update available"
- Click "Update" button
- Page reloads with new version

---

### Problem: Manifest.json Not Loading

**Symptom**: DevTools > Manifest shows error or blank

**Possible Causes**:
1. ❌ File doesn't exist
2. ❌ Invalid JSON syntax
3. ❌ MIME type wrong
4. ❌ Path incorrect

**Solutions**:

```bash
# 1. Check file exists
test -f public/manifest.json && echo "Exists" || echo "MISSING!"

# 2. Validate JSON
node -e "console.log(require('./public/manifest.json'))"
# Should print manifest or show JSON error

# 3. Check URL loads
curl https://your-domain.com/manifest.json
# Should return valid JSON

# 4. Check manifest link in HTML
# Browser DevTools > Elements
# Look for: <link rel="manifest" href="/manifest.json">
```

---

### Problem: App Installs But Icon is Generic

**Symptom**: App installs fine but shows generic icon instead of custom

**Possible Causes**:
1. ❌ Icons in wrong format
2. ❌ Icons not found in manifest.json
3. ❌ Icons have wrong purpose
4. ❌ Browser prefers different size

**Solutions**:

```javascript
// Check what manifest says about icons
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('Icons:', m.icons));

// Should show all 4 icons with correct src
```

---

### Problem: Offline Mode Errors

**Symptom**: Errors in console when testing offline

**Possible Causes**:
1. ❌ API call attempted while offline
2. ❌ Page not cached yet
3. ❌ Service worker has errors

**Solutions**:

```javascript
// Check connectivity
console.log('Online:', navigator.onLine);

// Listen for offline/online
window.addEventListener('offline', () => console.log('Offline'));
window.addEventListener('online', () => console.log('Online'));

// Wait for pages to load and cache before going offline
// 1. Load site normally
// 2. Click several pages
// 3. Then go offline
```

---

### Problem: Cache Growing Too Large

**Symptom**: Storage space warning, or poor performance

**Possible Causes**:
1. ❌ Old cache versions not deleted
2. ❌ Too many cached responses
3. ❌ Large files being cached

**Solutions**:

```javascript
// Clear all caches
caches.keys()
  .then(names => Promise.all(names.map(n => caches.delete(n))))
  .then(() => console.log('Caches cleared'));

// Or delete specific cache
caches.delete('pcs-v1')
  .then(deleted => console.log('Cache deleted:', deleted));

// Check cache size
caches.keys()
  .then(async names => {
    let total = 0;
    for (const name of names) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      keys.forEach(req => {
        cache.match(req).then(res => {
          if (res) total += res.headers.get('content-length') || 0;
        });
      });
    }
    console.log('Total cache size:', (total / 1024 / 1024).toFixed(2), 'MB');
  });
```

---

## 🔍 Debug Checklist

When something isn't working:

```
□ Check browser console for errors
□ Check DevTools > Application > Service Workers
□ Check DevTools > Application > Manifest
□ Check DevTools > Network > Offline toggle
□ Check manifest.json is valid JSON
□ Check sw.js exists and loads
□ Check icons exist in /public/
□ Clear browser cache (Cmd+Shift+R)
□ Restart dev server (npm run dev)
□ Check HTTPS/localhost
□ Check browser support
□ Check next.config.js updated
□ Check layout.tsx updated
□ Check Header has InstallAppButton
□ Check PWAProvider is in layout
```

---

## 📊 Performance Issues

### Problem: App Loads Slowly

**Check**:
1. First load vs return load time
2. Is service worker caching?
3. Are API calls network-first?

```javascript
// Check if page was served from cache
const perfData = performance.getEntriesByType('resource');
console.log(perfData); // Check "duration" and compare
```

### Solution:
- Service worker automatically optimizes ✅
- First load: normal
- Cached loads: much faster ⚡

---

## 🎯 Testing Checklist

Before deploying:

```
□ Install button appears
□ Can install app
□ App launches in standalone mode
□ App icon displays correctly
□ Offline fallback works
□ Service worker registers
□ manifest.json loads
□ No console errors
□ Cache working
□ Update detection works
□ All existing features work
```

---

## 📞 Still Having Issues?

1. **Check all files exist**:
   - `/public/manifest.json`
   - `/public/sw.js`
   - `/public/offline.html`
   - `/public/icon-*.png` (4 files)

2. **Run build and check for errors**:
   ```bash
   npm run build
   npm run lint
   ```

3. **Check deployment**:
   - Is Vercel deployment successful?
   - Are all files uploaded?

4. **Test locally first**:
   ```bash
   npm run dev
   # Test fully before pushing
   ```

5. **Check browser console**:
   - Look for [PWA] log messages
   - Look for error messages

If still stuck, share:
- Browser and version
- Error message from console
- Screenshot of DevTools

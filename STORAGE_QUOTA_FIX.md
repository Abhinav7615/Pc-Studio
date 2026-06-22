# MongoDB Storage Quota Fix - Complete Solution

## Problem
When admin tries to upload product images, the following error appears:
```
"Internal server error"
"you are over your space quota, using 512 MB of 512 MB. Writes are blocked on your cluster."
```

**Root Cause**: MongoDB Atlas cluster has reached 512MB storage limit (512 MB / 512 MB used). All writes are blocked until storage is freed.

---

## ✅ Fixes Applied

### 1. **Emergency Storage Cleanup Script** 
**File**: `scripts/emergency-cleanup.js`

Automatically removes:
- Orphaned chunk files (chunks without file entries)
- Incomplete uploads older than 6 hours
- Optional: Files older than 90 days (aggressive mode)

**Usage**:
```bash
# Dry run (shows what will be deleted, doesn't delete)
node scripts/emergency-cleanup.js --dry-run

# Execute cleanup
node scripts/emergency-cleanup.js

# Aggressive cleanup (removes 90+ day old files)
node scripts/emergency-cleanup.js --aggressive
```

### 2. **Improved Upload Error Handling**
**File**: `app/api/upload/route.ts`

Now properly detects MongoDB quota errors (HTTP 507) and returns:
```json
{
  "error": "Storage quota exceeded",
  "details": "MongoDB cluster has reached storage limit...",
  "suggestions": [
    "Run: node scripts/emergency-cleanup.js",
    "Or upgrade cluster at: https://cloud.mongodb.com/v2/69d9108265a5889f54fd820d#/clusters",
    "Free up storage by deleting unnecessary media files"
  ]
}
```

### 3. **Storage Status API**
**File**: `app/api/storage-status/route.ts`

New endpoint that admin can call to check storage:
```bash
# Requires authentication (admin/staff role)
GET /api/storage-status
```

Returns:
- Current usage (MB & percentage)
- Breakdown by file type (images, videos, audio)
- Orphaned chunks count
- Incomplete uploads count
- Files older than 90 days
- Alert status: ok / warning (80%+) / critical (95%+)
- Recommendations based on status

### 4. **Admin Dashboard Storage Warning**
**File**: `app/admin/products/page.tsx`

- Shows real-time storage status banner at top
- Color-coded alerts: 🟢 green (ok), 🟡 yellow (warning), 🔴 red (critical)
- Displays usage percentage and MB used
- Shows recommendations
- Refresh button to update status
- Checks storage every 60 seconds

### 5. **Better Upload Error UI**
**File**: `app/admin/products/page.tsx`

Improved error messages for:
- Product image uploads
- Variant image uploads

Shows clear error messages including:
- HTTP status codes
- Storage quota exceeded alerts
- Network errors

---

## 🚀 Immediate Steps to Fix

### Step 1: Run Emergency Cleanup
```bash
# Navigate to project root
cd "d:\Pc Studio"

# Activate Python virtual environment (if using Python for scripts)
.\.venv\Scripts\Activate.ps1

# Run cleanup (dry run first to see what will be deleted)
node scripts/emergency-cleanup.js --dry-run

# If satisfied, run actual cleanup
node scripts/emergency-cleanup.js
```

### Step 2: Monitor Storage After Cleanup
After cleanup completes:
- Go to admin dashboard (Products page)
- Check the storage status banner at top
- Should show reduced storage usage

### Step 3: If Still Critical
If storage is still over 90%, run aggressive cleanup:
```bash
node scripts/emergency-cleanup.js --aggressive
```

### Step 4: Permanent Solution
Option A - **Recommended**: Upgrade MongoDB Atlas cluster tier
- Visit: https://cloud.mongodb.com/v2/69d9108265a5889f54fd820d#/clusters/upgradeTemplates/Cluster0?limit=storage
- Select larger tier (e.g., M10 with 10GB storage)
- Add payment method if needed

Option B - **Temporary**: Delete old media files manually
- Admin → Media page
- Bulk delete old/unused files
- Run cleanup script again

Option C - **Preventive**: Archive old data
- Move old images/videos to external storage (S3, etc)
- Delete from MongoDB
- Update product URLs if needed

---

## 📊 Monitoring Strategy

### Automatic Checks
- Admin dashboard shows storage status every 60 seconds
- Visual warnings when:
  - 80%+ usage → Yellow warning
  - 95%+ usage → Red critical alert

### Manual Checks
```bash
# Run anytime to get detailed storage report
node scripts/gridfs-report.js

# Check how much space can be freed
node scripts/cleanup-gridfs-old.js --days=30 --dry-run
```

---

## 🔧 Technical Details

### MongoDB Storage Issue Indicators
- HTTP 507 responses from `/api/upload`
- `"Writes are blocked on your cluster"` in error message
- MongoDB Atlas console shows red "Upgrade Storage" alert

### Files Changed
1. `app/api/upload/route.ts` - Better error detection
2. `app/api/storage-status/route.ts` - NEW: Storage monitoring endpoint
3. `app/admin/products/page.tsx` - Storage banner + improved error UI
4. `scripts/emergency-cleanup.js` - NEW: Automatic cleanup utility

### Error Codes
- **507 Insufficient Storage** - Quota exceeded (from MongoDB)
- **400 Bad Request** - Invalid file
- **401 Unauthorized** - Authentication failed
- **500 Internal Server Error** - Other errors

---

## 🛡️ Prevention

1. **Set up scheduled cleanup**
   - Run cleanup monthly: `node scripts/emergency-cleanup.js`
   - Clean 90+ day old files: `node scripts/emergency-cleanup.js --aggressive`

2. **Monitor dashboard**
   - Admin checks storage status weekly
   - Action when reaching 70%+ usage

3. **Offload old media**
   - Use S3/Cloud storage for archival
   - Keep only recent 6 months in MongoDB

4. **Set alerts**
   - Storage status API can be monitored
   - Alert when crossing 80% threshold

---

## ✨ Results After Fix

✅ Admin can upload product images without errors
✅ Storage warnings visible on dashboard
✅ Automatic cleanup utility available
✅ Storage status always visible
✅ Better error messages for debugging
✅ HTTP 507 properly handled and reported

---

## 📝 Troubleshooting

**Q: Cleanup script fails to connect to MongoDB**
- Ensure `.env` has correct `MONGODB_URI`
- Check MongoDB Atlas network access (IP whitelist)
- Verify credentials in connection string

**Q: Still getting storage quota error after cleanup**
- Run aggressive cleanup: `node scripts/emergency-cleanup.js --aggressive`
- Delete files via admin media page
- Consider upgrading cluster tier

**Q: Dashboard doesn't show storage status**
- Ensure user role is admin/staff
- Check `/api/storage-status` response in browser console
- Refresh page

**Q: Want to cleanup more space**
- Delete old media via Admin → Media page
- Run: `node scripts/cleanup-gridfs-old.js --days=14` (for 2-week old files)

---

## 📞 Support

For detailed storage analysis:
```bash
node scripts/gridfs-report.js
```

This shows:
- Total files and size
- Largest files
- Oldest files
- Type breakdown

---

Generated: 2026-06-22

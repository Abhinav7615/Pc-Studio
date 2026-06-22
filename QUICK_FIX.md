# 🚨 MongoDB Storage Full - IMMEDIATE FIX

## What's Wrong?
Product image uploads fail with: **"you are over your space quota, using 512 MB of 512 MB"**

## Fix It Now (5 Minutes)

### Step 1: Open Terminal
```
Press: Ctrl + ~  (opens terminal in VS Code)
OR
Terminal → New Terminal
```

### Step 2: Navigate to Project
```bash
cd "d:\Pc Studio"
```

### Step 3: Check What Will Be Deleted (Safe)
```bash
node scripts/emergency-cleanup.js --dry-run
```

**Output should show**:
```
🧹 Emergency Storage Cleanup Started

1️⃣ Cleaning orphaned chunks...
   Total chunks in DB: 156
   Found X orphaned chunks
   
2️⃣ Cleaning incomplete uploads...
   Found X old chunk files
   
3️⃣ Aggressive cleanup...
   [skipped]
   
📊 Final Storage Report:
   Total files: XXX
   Total size: XXX MB
   
⚠️ DRY RUN MODE - No files were deleted.
```

### Step 4: Actually Delete (Safe - Only Removes Junk)
```bash
node scripts/emergency-cleanup.js
```

**Wait for it to complete. Should say**:
```
✅ Cleanup completed successfully!
```

### Step 5: Verify Fix in UI
1. Go to: **Admin → Product Management**
2. Look at **top of page** - should see storage banner:
   ```
   ✅ Storage OK
   Using XXX MB of 512 MB (XX%)
   ```
3. Try uploading a product image - should work now ✅

---

## Still Getting Error? Do Aggressive Cleanup

```bash
node scripts/emergency-cleanup.js --aggressive
```

This also deletes files older than 90 days (more space freed).

---

## Check Storage Anytime

```bash
# See detailed report
node scripts/gridfs-report.js

# OR in browser, visit (must be logged in as admin):
http://localhost:3000/api/storage-status
```

---

## Long-term Fix (Pick One)

### Option A: Upgrade MongoDB (Best)
- Visit: https://cloud.mongodb.com/v2/69d9108265a5889f54fd820d#/clusters/upgradeTemplates/Cluster0?limit=storage
- Choose M10 tier (10GB)
- Add payment method
- Done ✅

### Option B: Delete Old Files Monthly
```bash
# Run once per month
node scripts/emergency-cleanup.js --aggressive
```

### Option C: Move Old Media to Cloud
- Admin → Media page
- Delete old images/videos
- Store elsewhere (Google Drive, AWS S3, etc)

---

## Need Help?

**If cleanup doesn't work**:
1. Make sure MongoDB connection is working
2. Check `.env` file has `MONGODB_URI`
3. Try again: `node scripts/emergency-cleanup.js`

**If storage still full**:
- Run with --aggressive flag
- Or delete files manually: Admin → Media → Delete old files
- Or upgrade cluster tier

---

## Dashboard Warning Levels

After fix, dashboard will show:

🟢 **GREEN (OK)**: 0-80% usage - Normal operation
🟡 **YELLOW (WARNING)**: 80-95% - Run cleanup soon
🔴 **RED (CRITICAL)**: 95%+ - Run cleanup NOW

---

## Done ✅

- Cleanup is done
- Dashboard shows new storage percentage
- Can upload images again
- Scheduled to check automatically

**Questions?** Check `STORAGE_QUOTA_FIX.md` or `STORAGE_FIX_IMPLEMENTATION.md`

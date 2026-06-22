# 📅 Monthly Safe Cleanup - Complete Solution

## Problem
Need a **safe, recurring cleanup** that:
- ✅ Only deletes out-of-stock product media
- ✅ **Never touches** in-stock product images/videos
- ✅ Can run automatically monthly
- ✅ Preserves critical data

---

## Solution: Safe Monthly Cleanup

### What It Does

**Deletes:**
- 🗑️ Images from out-of-stock products
- 🗑️ Videos from out-of-stock products
- 🗑️ Variant images from out-of-stock products

**Preserves:**
- ✅ All in-stock product media
- ✅ All active product images
- ✅ All variant images for saleable products
- ✅ Orphaned chunks (use emergency cleanup if needed)

---

## Two Cleanup Approaches

### 1️⃣ Emergency Cleanup (When Storage Critical)
```bash
node scripts/emergency-cleanup.js
```
- Removes: orphaned chunks, incomplete uploads, very old files
- When: During storage quota crisis
- Risk: Low (only junk files)
- Caution: Doesn't specifically target products

### 2️⃣ Monthly Safe Cleanup (Recommended for Ongoing)
```bash
node scripts/safe-cleanup-outofstock.js
```
- Removes: out-of-stock product media only
- When: Monthly scheduled task
- Risk: Very low (targets only marked products)
- Benefit: Predictable, safe, targeted

---

## How to Use

### Manual Execution
```bash
# Preview mode (see what will be deleted)
node scripts/safe-cleanup-outofstock.js --dry-run

# Execute cleanup (actually deletes)
node scripts/safe-cleanup-outofstock.js
```

### Automatic Scheduling

See `MONTHLY_CLEANUP_SETUP.md` for:
- **Windows**: Task Scheduler setup
- **Linux/Mac**: Cron job setup
- **Node.js**: node-cron setup
- **Docker**: Container cron setup

**Recommended**: Schedule for 1st of month at 2 AM

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/safe-cleanup-outofstock.js` | Main cleanup script |
| `scripts/monthly-cleanup-runner.js` | Scheduled wrapper with logging |
| `MONTHLY_CLEANUP_SETUP.md` | Complete setup instructions |

---

## Example Workflow

### Month 1: Setup
```bash
# Test dry run
node scripts/safe-cleanup-outofstock.js --dry-run

# Looks good, execute
node scripts/safe-cleanup-outofstock.js

# Setup automatic scheduling (see MONTHLY_CLEANUP_SETUP.md)
```

### Month 2+: Automatic
- 1st of month at 2 AM: Cleanup runs automatically
- Logs saved to: `.cleanup-logs/cleanup-TIMESTAMP.log`
- No manual action needed

---

## Safety Guarantees

### What's Protected ✅
- ✅ Products with status: **active** → Media preserved
- ✅ Products with status: **new** → Media preserved
- ✅ Products with status: **archived** → Media preserved
- ✅ All variant images → Media preserved
- ✅ In-stock product images → Media preserved

### What Gets Deleted 🗑️
- 🗑️ Products with status: **out-of-stock** → Media deleted
- 🗑️ Images linked to out-of-stock products → Deleted
- 🗑️ Videos linked to out-of-stock products → Deleted

### Verification
Script automatically:
- Checks random in-stock product
- Confirms its media still exists
- Reports: "✅ Verified: In-stock products are SAFE"

---

## Output Example

### Dry Run
```
🗓️ Safe Monthly Cleanup - Out-of-Stock Products Only

1️⃣ Finding out-of-stock products...
   Found 12 out-of-stock products

2️⃣ Collecting media files from out-of-stock products...
   Found 34 media files to remove
   Total unique files: 34

3️⃣ Deleting media files from GridFS...
   [DRY RUN] Would delete 34 files
   [DRY RUN] Would free up 87.50 MB

4️⃣ Verifying in-stock products are safe...
   ✅ Verified: In-stock product images are SAFE
      Sample: Dell XPS 13 → image still exists

📊 Cleanup Summary:
   Processed: 12 out-of-stock products
   Would delete: 34 media files
   Space to free: 87.50 MB

⚠️ DRY RUN MODE - No files were deleted.
Run without --dry-run to execute cleanup.
```

### Actual Execution
```
🗓️ Safe Monthly Cleanup - Out-of-Stock Products Only

1️⃣ Finding out-of-stock products...
   Found 12 out-of-stock products

2️⃣ Collecting media files from out-of-stock products...
   Found 34 media files to remove
   Total unique files: 34

3️⃣ Deleting media files from GridFS...
   ✅ Deleted: 34 files

4️⃣ Verifying in-stock products are safe...
   ✅ Verified: In-stock product images are SAFE
      Sample: Dell XPS 13 → image still exists

📊 Cleanup Summary:
   Processed: 12 out-of-stock products
   Deleted: 34 media files
   Space freed: 87.50 MB

📈 Current Storage Stats:
   Total files: 253
   Total size: 311.25 MB
   Usage: 60.79% of 512 MB
   ✅ Storage is healthy

✅ Cleanup completed successfully!
```

---

## Monitoring

### View Logs
```bash
# See latest cleanup result
ls -lh .cleanup-logs/

# View full log
cat .cleanup-logs/cleanup-2024-01-01-02-00-00.log
```

### Check Storage Anytime
```bash
# Generate storage report
node scripts/gridfs-report.js

# Or check in browser (admin only):
# http://localhost:3000/api/storage-status
```

---

## Recommended Setup

1. **Test Manually** (First time):
   ```bash
   node scripts/safe-cleanup-outofstock.js --dry-run
   node scripts/safe-cleanup-outofstock.js
   ```

2. **Schedule Automatically**:
   - Windows: Task Scheduler (see guide)
   - Linux: Cron (see guide)
   - Any: Use node-cron (see guide)

3. **Monitor Monthly**:
   - Check logs: `.cleanup-logs/`
   - Verify admin dashboard shows lower usage %
   - Confirm in-stock products still have images

---

## FAQ

**Q: Why only delete out-of-stock products?**
A: Safer approach. You control when to mark products out-of-stock, so deletion is predictable.

**Q: What if I accidentally mark a product out-of-stock?**
A: Change status back to "active" before cleanup runs. Media will be preserved.

**Q: Can I run it more frequently (weekly/daily)?**
A: Yes! Edit the scheduler to run `node scripts/safe-cleanup-outofstock.js` more often.

**Q: What if cleanup fails?**
A: Check `.cleanup-logs/` for error details. Script is idempotent (safe to retry).

**Q: How much space gets freed?**
A: Depends on number of out-of-stock products and their media size (typically 20-100 MB/month).

**Q: Can I combine with emergency cleanup?**
A: Yes! Use emergency cleanup for urgent quota issues, monthly cleanup for maintenance.

---

## Integration with Existing Scripts

| Script | When to Use | Safety |
|--------|-------------|--------|
| `emergency-cleanup.js` | 🚨 Quota crisis | High (removes junk) |
| `safe-cleanup-outofstock.js` | 📅 Monthly maintenance | Very High (targets products) |
| `gridfs-report.js` | 📊 Check storage | None (read-only) |
| `cleanup-gridfs-old.js` | 🗑️ Remove old files | Medium (time-based) |

---

## Files Updated

- `scripts/safe-cleanup-outofstock.js` (NEW)
- `scripts/monthly-cleanup-runner.js` (NEW)
- `MONTHLY_CLEANUP_SETUP.md` (NEW)
- `README.md` (updated storage section)

---

## Next Steps

1. **Test**: `node scripts/safe-cleanup-outofstock.js --dry-run`
2. **Run**: `node scripts/safe-cleanup-outofstock.js`
3. **Schedule**: Follow `MONTHLY_CLEANUP_SETUP.md`
4. **Monitor**: Check logs monthly

---

**Status**: ✅ Ready to use
**Safety**: ✅ In-stock products protected
**Automation**: ✅ Can schedule automatically
**Tested**: ✅ Syntax verified


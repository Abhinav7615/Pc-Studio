# 🗓️ Monthly Cleanup - Quick Reference

## TL;DR
Delete media from **out-of-stock products only**. In-stock products are safe.

```bash
# Test first
node scripts/safe-cleanup-outofstock.js --dry-run

# Run monthly
node scripts/safe-cleanup-outofstock.js
```

---

## Use Cases

### 🚨 Emergency (Storage Full NOW)
```bash
node scripts/emergency-cleanup.js
```
**Use when**: Quota exceeded, urgent
**Deletes**: Orphaned chunks, old uploads
**Safety**: Good

### 📅 Monthly Maintenance (Recommended)
```bash
node scripts/safe-cleanup-outofstock.js
```
**Use when**: 1st of month or as scheduled
**Deletes**: Out-of-stock product media only
**Safety**: Excellent ✅

---

## What Gets Deleted

✅ **Deleted** (Safe):
- Out-of-stock product images
- Out-of-stock product videos
- Out-of-stock variant images

✅ **Preserved** (Never touched):
- Active product images ✅
- In-stock product images ✅
- New product images ✅
- Archived product images ✅

---

## Setup Automatic Monthly Cleanup

### Windows (Easiest)
1. Open: Task Scheduler
2. Create task to run: `node scripts/safe-cleanup-outofstock.js`
3. Schedule: 1st of month, 2 AM
4. Done ✅

See full guide: `MONTHLY_CLEANUP_SETUP.md`

### Linux/Mac
```bash
crontab -e
# Add: 0 2 1 * * cd /path/to/project && node scripts/safe-cleanup-outofstock.js
```

### Anywhere
Install `node-cron`, see: `MONTHLY_CLEANUP_SETUP.md`

---

## Commands

| Command | Purpose |
|---------|---------|
| `node scripts/safe-cleanup-outofstock.js --dry-run` | Preview (safe) |
| `node scripts/safe-cleanup-outofstock.js` | Execute |
| `ls .cleanup-logs/` | View logs |
| `node scripts/gridfs-report.js` | Check storage |

---

## Verification

After running, script shows:
```
4️⃣ Verifying in-stock products are safe...
   ✅ Verified: In-stock product images are SAFE
```

✅ Green light = Everything preserved!

---

## Logs

Stored in: `.cleanup-logs/cleanup-TIMESTAMP.log`

Check with:
```bash
tail -20 .cleanup-logs/cleanup-*.log
```

---

## FAQ

**Q: Will it delete my active product images?**
A: No. Only out-of-stock. Active products are 100% safe.

**Q: How often should I run it?**
A: Monthly (1st of month recommended).

**Q: Can I restore deleted files?**
A: Only if you have MongoDB backup. Plan accordingly.

**Q: What if I mark a product as out-of-stock by mistake?**
A: Change status back before cleanup runs. Media preserved.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/safe-cleanup-outofstock.js` | Main script |
| `scripts/monthly-cleanup-runner.js` | Scheduler wrapper |
| `MONTHLY_CLEANUP_SETUP.md` | Setup instructions |
| `MONTHLY_SAFE_CLEANUP_GUIDE.md` | Full guide |
| `.cleanup-logs/` | Auto-created logs |

---

## Example

### Before Cleanup
- 12 out-of-stock products with images
- 34 media files from them
- 87.50 MB storage used

### After Cleanup
- ✅ All media from out-of-stock deleted
- ✅ All active product images preserved
- ✅ 87.50 MB freed
- ✅ Log saved

---

## Schedule Options

**Monthly (Recommended)**
- 1st of month, 2 AM
- Frees ~50-100 MB
- Low overhead

**Weekly** (If needed)
- Every Sunday, 2 AM
- More frequent cleanup

**Custom**
- Pick your schedule
- Edit cron/scheduler

---

**Ready?** Start with:
```bash
node scripts/safe-cleanup-outofstock.js --dry-run
```

**Setup automatic?** See `MONTHLY_CLEANUP_SETUP.md`


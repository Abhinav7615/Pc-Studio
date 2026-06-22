# 🗓️ Monthly Safe Cleanup Setup

## What It Does
Deletes media files **ONLY** from out-of-stock products. In-stock product media is **always preserved**.

**Safe because:**
- ✅ Never touches in-stock product images/videos
- ✅ Only removes files from products marked "out-of-stock"
- ✅ Verifies in-stock products are safe after cleanup
- ✅ Dry-run mode to preview before executing

---

## Quick Start

### Manual Cleanup (Anytime)
```bash
# See what will be deleted (SAFE - doesn't delete)
node scripts/safe-cleanup-outofstock.js --dry-run

# Execute cleanup (actually deletes out-of-stock product media)
node scripts/safe-cleanup-outofstock.js
```

### One-time Manual Run
```bash
# Run once to cleanup existing out-of-stock media
node scripts/safe-cleanup-outofstock.js
```

---

## Automatic Monthly Cleanup

### Option A: Windows Task Scheduler (Easiest)

1. **Open Task Scheduler**:
   - Press `Win + R` → Type `taskschd.msc` → Enter

2. **Create New Task**:
   - Right-click "Task Scheduler Library" → "Create Basic Task"
   - **Name**: `PC-Studio Monthly Cleanup`
   - **Description**: Delete media from out-of-stock products

3. **Set Schedule**:
   - Trigger: "Monthly"
   - Day: 1st
   - Time: 02:00 AM (choose quiet time)

4. **Set Action**:
   - **Action**: Start a program
   - **Program/Script**: `node`
   - **Arguments**: `scripts/safe-cleanup-outofstock.js`
   - **Start in**: `d:\Pc Studio`

5. **Finish** ✅

---

### Option B: Cron (Linux/Mac)

1. **Edit crontab**:
   ```bash
   crontab -e
   ```

2. **Add this line**:
   ```bash
   # Run on 1st of month at 2 AM
   0 2 1 * * cd /path/to/Pc-Studio && node scripts/safe-cleanup-outofstock.js >> /var/log/pc-studio-cleanup.log 2>&1
   ```

3. **Save** (press Ctrl+X, then Y, then Enter)

---

### Option C: Node.js Scheduler (Works Everywhere)

Install package:
```bash
npm install node-cron
```

Create `scripts/scheduled-cleanup.js`:
```javascript
const cron = require('node-cron');
const { spawn } = require('child_process');

// Run at 2 AM on 1st day of every month
cron.schedule('0 2 1 * *', () => {
  console.log('🗓️ Running monthly cleanup...');
  const cleanup = spawn('node', ['scripts/safe-cleanup-outofstock.js']);
  
  cleanup.on('close', (code) => {
    console.log(`Cleanup exited with code ${code}`);
  });
});

console.log('⏰ Cleanup scheduler started. Runs on 1st of month at 2 AM');
```

Run with:
```bash
node scripts/scheduled-cleanup.js
```

---

## How It Works

### Step 1: Find Out-of-Stock Products
```
✓ Query: products with status = "out-of-stock"
✓ Result: List of all out-of-stock products
```

### Step 2: Collect Media Files
```
✓ Get images from: product.images
✓ Get videos from: product.videos
✓ Get variant images from: product.variants[].images
✓ Extract filenames from URLs
```

### Step 3: Delete from GridFS
```
✓ Find each file in MongoDB GridFS
✓ Delete only if it belongs to out-of-stock product
✓ Report deleted files
```

### Step 4: Verify Safety
```
✓ Check random in-stock product
✓ Verify its media still exists
✓ Show confirmation: "In-stock products are SAFE"
```

---

## Example Output

### Dry Run (Preview):
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

📊 Cleanup Summary:
   Processed: 12 out-of-stock products
   Would delete: 34 media files
   Space to free: 87.50 MB

📈 Current Storage Stats:
   Total files: 287
   Total size: 398.75 MB
   Usage: 77.88% of 512 MB
   ✅ Storage is healthy

⚠️ DRY RUN MODE - No files were deleted.
```

### Actual Execution:
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

### Check Cleanup Logs
```bash
# View latest log
cat .cleanup-logs/cleanup-*.log | tail -50

# Or find all logs
ls -lh .cleanup-logs/
```

### Check Storage Anytime
```bash
# See current usage
node scripts/gridfs-report.js

# Or in browser (admin only):
http://localhost:3000/api/storage-status
```

---

## Safety Guarantees

| Scenario | Result |
|----------|--------|
| Out-of-stock product images | ✅ **DELETED** |
| In-stock product images | ✅ **PRESERVED** |
| Active product variant images | ✅ **PRESERVED** |
| Archived product media | ✅ **DELETED** |
| Orphaned chunks | ✅ **DELETED** |
| Admin media files (not linked) | ⚠️ **Preserved** (safer) |

---

## FAQ

**Q: Will it delete my active product images?**
A: No, only out-of-stock products. Active/in-stock products are 100% safe.

**Q: Can I run it manually anytime?**
A: Yes! `node scripts/safe-cleanup-outofstock.js` anytime.

**Q: What if I accidentally mark a product out-of-stock?**
A: Media is only deleted on next cleanup run. You have time to fix it before cleanup.

**Q: How much space gets freed?**
A: Depends on how many out-of-stock products exist and their media size. Usually 20-100 MB monthly.

**Q: What if cleanup fails?**
A: Check `.cleanup-logs/` for error details. Run with `--dry-run` first to debug.

**Q: Can I schedule it differently (not 1st of month)?**
A: Yes, edit the cron/scheduler time as needed. Examples:
   - Daily: `0 2 * * *` (2 AM daily)
   - Weekly: `0 2 * * 0` (Sundays 2 AM)
   - Quarterly: `0 2 1 0,3,6,9 *` (1st of Q months)

---

## Recommended Schedule

**Best Practice**: Run on 1st of month at 2 AM
- Quiet time (low traffic)
- Before business hours
- Monthly gives control to archive/restore

---

## Files

- `scripts/safe-cleanup-outofstock.js` - Main cleanup logic
- `scripts/monthly-cleanup-runner.js` - Logging wrapper for scheduled runs
- `.cleanup-logs/` - Created automatically, stores logs

---

**Status**: ✅ Ready to use
**Safety**: ✅ In-stock products protected
**Automation**: ✅ Can schedule automatically


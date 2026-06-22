# 📦 Complete Media Storage Management System

## Overview
Comprehensive media management system with automatic cleanup, manual deletion, and recycle bin functionality for:
- Product images/videos
- Payment screenshots & proof
- Order documents
- Support ticket attachments
- User uploads
- Admin media

---

## 🗂️ Part 1: Database Schema Changes

### 1.1 New Collections

```javascript
// collections/MediaMetadata
{
  _id: ObjectId,
  fileId: ObjectId,           // GridFS file ID
  fileName: string,
  fileSize: number,           // bytes
  contentType: string,        // image/jpeg, image/png, video/mp4, etc.
  
  // Category & Purpose
  category: string,           // 'product', 'payment', 'order', 'support', 'user_profile'
  purpose: string,            // 'product_image', 'payment_screenshot', 'invoice', 'receipt', 'identity_proof'
  
  // Links to Business Objects
  linkedToProduct: ObjectId,  // Product ID if product media
  linkedToOrder: ObjectId,    // Order ID if order related
  linkedToUser: ObjectId,     // User ID if user related
  linkedToTicket: ObjectId,   // Support Ticket ID if support related
  linkedToPayment: ObjectId,  // Payment ID if payment related
  
  // Status & Lifecycle
  status: string,             // 'active', 'deleted', 'archived'
  uploadedBy: ObjectId,       // User who uploaded
  uploadedAt: Date,
  lastAccessedAt: Date,
  
  // Deletion Tracking
  deletedAt: Date,            // When marked as deleted
  deletedBy: ObjectId,        // Who deleted it
  permanentlyDeletedAt: Date, // When permanently deleted
  
  // Tags & Metadata
  tags: [string],             // ['important', 'verified', 'temporary']
  expiryDate: Date,           // Auto-delete after this date
  isTemporary: boolean,       // true if temporary (like payment screenshot during order)
  
  // Recycle Bin Info
  inRecycleBin: boolean,
  recycleBinAddedAt: Date,
  recycleBinExpiresAt: Date,  // Auto-permanent delete after 30 days
  
  // Storage Analytics
  accessCount: number,
  lastModifiedAt: Date
}

// collections/DeletedMedia (Recycle Bin)
{
  _id: ObjectId,
  originalMetadataId: ObjectId,
  fileId: ObjectId,
  fileName: string,
  fileSize: number,
  category: string,
  purpose: string,
  
  deletedAt: Date,
  deletedBy: ObjectId,        // Admin who deleted
  reason: string,             // 'manual', 'auto_cleanup', 'user_request', 'order_complete'
  
  linkedObjects: {            // References to what this was linked to
    productId: ObjectId,
    orderId: ObjectId,
    userId: ObjectId,
    ticketId: ObjectId
  },
  
  recoveryDeadline: Date,     // Until when can be recovered (30 days default)
  metadata: Object            // Original metadata backup
}

// collections/StorageCleanupLogs
{
  _id: ObjectId,
  cleanupType: string,        // 'automatic', 'manual', 'scheduled'
  executedAt: Date,
  executedBy: ObjectId,       // Admin ID for manual, 'system' for automatic
  
  filesDeleted: number,
  spaceFreed: number,         // bytes
  spaceFreedMB: number,
  
  deletionReason: string,     // 'expired', 'order_completed', 'manual_cleanup', 'beyond_retention'
  deletedMediaIds: [ObjectId],
  
  status: string,             // 'success', 'partial', 'failed'
  errorLog: string,
  
  storageStatusBefore: {
    usedMB: number,
    usagePercent: number
  },
  storageStatusAfter: {
    usedMB: number,
    usagePercent: number
  }
}
```

---

## 🔄 Part 2: Automatic Cleanup Rules

### 2.1 Cleanup Triggers

```
RULE 1: Expired Payment Screenshots
├─ After: Order completed + 90 days passed
├─ Delete if: status = 'completed' AND purpose = 'payment_screenshot'
└─ Move to: RecycleBin for 30 days

RULE 2: Temporary Order Documents
├─ After: Order delivered + 30 days
├─ Delete if: isTemporary = true AND purpose = 'invoice'
└─ Keep: order confirmation for business records

RULE 3: Support Ticket Attachments
├─ After: Ticket resolved + 60 days OR Ticket closed + 365 days
├─ Delete if: status = 'closed' AND olderthan(60d)
└─ Move to: RecycleBin

RULE 4: Abandoned Product Drafts
├─ After: Last modified + 180 days AND not published
├─ Delete if: linkedToProduct exists but product = 'draft'
└─ Move to: RecycleBin

RULE 5: Inactive User Profile Pictures
├─ After: User inactive + 1 year
├─ Delete if: lastAccessedAt < 365 days
└─ Move to: RecycleBin

RULE 6: Duplicate Media Files
├─ After: Same file uploaded multiple times
├─ Keep: Latest version only
├─ Delete if: size > 50MB AND duplicate exists
└─ Move to: RecycleBin
```

### 2.2 Cleanup Schedule

```
DAILY (2 AM UTC):
- Check for expired temporary files
- Move files to RecycleBin if marked for deletion
- Clean RecycleBin items older than 30 days

WEEKLY (Sunday 3 AM UTC):
- Check for order-related cleanup (Rule 2)
- Analyze duplicate files
- Generate cleanup report

MONTHLY (1st day, 4 AM UTC):
- Full media audit
- Clean old support ticket attachments (Rule 3)
- Clean inactive user media (Rule 5)
- Generate monthly cleanup summary

QUARTERLY:
- Analyze storage patterns
- Update retention policies
- Archive old data if needed
```

---

## 📡 Part 3: API Endpoints

### 3.1 Upload & Metadata

```
POST /api/media/upload
├─ Body: { file, category, purpose, linkedTo: {productId?, orderId?, userId?, ticketId?}, expiryDate?, tags? }
├─ Returns: { fileId, metadataId, url, size }
└─ Auto-creates metadata with status='active'

GET /api/media/metadata/:fileId
├─ Returns: Complete metadata
└─ Updates lastAccessedAt

GET /api/media/list
├─ Query: { category?, purpose?, linkedTo?, status? }
├─ Returns: Paginated media list with metadata
└─ Admin only (filter = active only)
```

### 3.2 Manual Cleanup

```
POST /api/media/delete/:fileId
├─ Soft delete (move to RecycleBin)
├─ Body: { reason: string }
├─ Update: status='deleted', deletedAt=now, inRecycleBin=true
├─ Create: DeletedMedia entry
└─ Returns: { success, message, recoveryDeadline }

POST /api/media/delete-bulk
├─ Soft delete multiple files
├─ Body: { fileIds: [id1, id2...], reason: string }
├─ Returns: { deleted: count, spaceFreed: MB }
└─ Create cleanup log

DELETE /api/media/permanent/:fileId
├─ Permanently delete (skip RecycleBin)
├─ Remove from GridFS
├─ Delete metadata
└─ Log to StorageCleanupLogs

DELETE /api/media/permanent-bulk
├─ Permanent delete multiple
├─ Body: { fileIds: [...] }
├─ Returns: { deleted: count, spaceFreed: MB }
```

### 3.3 Recycle Bin

```
GET /api/media/recycle-bin
├─ Query: { page?, limit?, sort? }
├─ Returns: All files in RecycleBin (status='deleted')
└─ Include recovery deadline countdown

POST /api/media/recycle-bin/recover/:fileId
├─ Restore from RecycleBin
├─ Update: status='active', inRecycleBin=false, deletedAt=null
├─ Create log entry
└─ Restore to original location

POST /api/media/recycle-bin/recover-bulk
├─ Restore multiple files
├─ Body: { fileIds: [...] }
└─ Returns: { recovered: count }

POST /api/media/recycle-bin/empty
├─ Permanently delete all in RecycleBin older than 30 days
├─ Confirm with: { confirmed: true }
├─ Returns: { deleted: count, spaceFreed: MB }

DELETE /api/media/recycle-bin/:fileId
├─ Permanently delete single item from RecycleBin
├─ Skip waiting period
└─ Update storage stats
```

### 3.4 Cleanup Management

```
GET /api/media/cleanup/status
├─ Returns: { 
    lastCleanupAt, 
    nextScheduledCleanup,
    recycleBinCount,
    recycleBinSizeMB,
    expiredMediaCount,
    suggestedCleanupActions
  }
└─ Admin only

POST /api/media/cleanup/run-manual
├─ Manually trigger cleanup
├─ Body: { type: 'expired'|'temporary'|'duplicate'|'old_support'|'inactive_users'|'all' }
├─ Returns: cleanup report
└─ Async operation with job tracking

GET /api/media/cleanup/logs
├─ Query: { type?, startDate?, endDate?, page? }
├─ Returns: Paginated cleanup logs
└─ Admin dashboard data

GET /api/media/cleanup/schedule
├─ Returns: All scheduled cleanup tasks
├─ Include next run times

POST /api/media/cleanup/schedule/update
├─ Update cleanup policy
├─ Body: { paymentScreenshotRetention: 90, supportTicketRetention: 60, ... }
└─ Admin only
```

### 3.5 Storage Analytics

```
GET /api/media/analytics
├─ Returns: {
    totalFiles: number,
    totalSizeMB: number,
    byCategory: { product: MB, payment: MB, order: MB, ... },
    byStatus: { active: MB, deleted: MB },
    growthTrend: [...last 12 months],
    cleanupHistory: [...last 5 cleanups],
    storageHealth: percentage,
    recommendations: [...]
  }
└─ Admin only

GET /api/media/analytics/category/:category
├─ Detailed breakdown for category
├─ Include linked objects stats
└─ Admin only
```

---

## 🎨 Part 4: Admin Panel UI Components

### 4.1 Media Management Dashboard

```
📊 STORAGE OVERVIEW
┌─────────────────────────────────────────┐
│ Total Size: 450 MB / 512 MB (88%)      │
│ Files: 2,450 active, 145 in trash      │
│ Last Cleanup: 2 days ago               │
│ Next Auto-Cleanup: Tomorrow 2 AM       │
└─────────────────────────────────────────┘

BREAKDOWN BY CATEGORY
┌──────────────────────────────────────────┐
│ Product Images:      280 MB (62%)       │
│ Payment Screenshots: 100 MB (22%)       │
│ Order Documents:     45 MB (10%)        │
│ Support Tickets:     15 MB (3%)         │
│ User Profiles:       10 MB (2%)         │
└──────────────────────────────────────────┘

QUICK ACTIONS
┌──────────────────────────────────────────┐
│ [🔧 Manual Cleanup]  [🗑️ Recycle Bin]   │
│ [📊 View Analytics]  [⚙️ Settings]      │
└──────────────────────────────────────────┘
```

### 4.2 Manual Cleanup Interface

```
CLEANUP BY CATEGORY
┌──────────────────────────────────────────┐
│ ✓ Product Images          [0 days old]  │
│   └─ 450 files, 280 MB                  │
│   └─ [Select All]  [Preview]           │
│                                          │
│ ✓ Payment Screenshots     [90+ days]    │
│   └─ 156 files, 89 MB                  │
│   └─ [Auto-Delete Ready] [Delete]     │
│                                          │
│ ✓ Order Documents         [30+ days]    │
│   └─ 89 files, 25 MB                   │
│   └─ [Select All]  [Preview]           │
│                                          │
│ ✓ Support Attachments     [60+ days]    │
│   └─ 234 files, 12 MB                  │
│   └─ [Select All]  [Preview]           │
│                                          │
│ ✓ Temporary/Orphaned      [All]         │
│   └─ 45 files, 8 MB                    │
│   └─ [Delete Orphaned]                 │
└──────────────────────────────────────────┘

BATCH CLEANUP OPTIONS
┌──────────────────────────────────────────┐
│ ☐ Expired Payment Screenshots (90+ days)│
│ ☐ Old Order Documents (30+ days)       │
│ ☐ Resolved Support Tickets (60+ days)  │
│ ☐ Inactive User Media (365+ days)      │
│ ☐ Duplicate Files                       │
│ ☐ Orphaned Media (no linked objects)   │
│                                          │
│ Total To Delete: 234 files (45.6 MB)   │
│                                          │
│ [Preview All]  [Send to Recycle Bin]   │
└──────────────────────────────────────────┘
```

### 4.3 Recycle Bin Interface

```
🗑️ RECYCLE BIN (145 items, 32 MB)
┌──────────────────────────────────────────┐
│ Recovery Deadline: Auto-delete in 15 days│
├──────────────────────────────────────────┤
│                                          │
│ [Sort: Latest ▼]  [Filter: All ▼]      │
│ [Search...]                             │
│                                          │
├────┬──────────────┬─────────┬──────────┤
│    │ File Name    │ Size    │ Deleted  │
├────┼──────────────┼─────────┼──────────┤
│ ☐  │ product1.jpg │ 2.3 MB  │ 2 days  │
│    │ 🔗 Product#123                   │
│    │ Deleted by: Admin (Manual)       │
│    │ [Recover] [Delete]               │
│    │                                  │
│ ☐  │ payment_sc.png│ 1.1 MB │ 5 days │
│    │ 🔗 Order#456                     │
│    │ Deleted by: System (Auto-clean)  │
│    │ [Recover] [Delete]               │
│    │                                  │
│ ☐  │ invoice.pdf  │ 0.8 MB  │ 10 days│
│    │ 🔗 Order#789                     │
│    │ Will auto-delete in: 20 days    │
│    │ [Recover] [Delete]               │
│                                          │
├──────────────────────────────────────────┤
│ [Select All]  [Recover Selected]  [Empty Bin]
└──────────────────────────────────────────┘
```

### 4.4 Cleanup History & Logs

```
📋 CLEANUP HISTORY
┌──────────────────────────────────────────┐
│ [Filter: All Types ▼] [Date Range ▼]   │
│                                          │
├────┬──────────┬──────────┬──────────────┤
│Date│ Type     │ Deleted  │ Space Freed  │
├────┼──────────┼──────────┼──────────────┤
│Jun │ Automatic│ 145 files│ 45.2 MB     │
│22  │ Payment  │ (All expired)            │
│    │ Screenshots                         │
│    │ Status: ✅ Success                 │
│    │ [View Details] [Undo]              │
│    │                                    │
│Jun │ Manual   │ 23 files │ 12.5 MB     │
│21  │ Support  │ (User deleted)           │
│    │ Tickets  │                         │
│    │ By: Admin123                       │
│    │ Status: ✅ Success                 │
│    │ [View Details]                     │
│    │                                    │
│Jun │ Automatic│ 34 files │ 8.9 MB      │
│15  │ Duplicate│ (Removed duplicates)    │
│    │ Files    │                         │
│    │ Status: ✅ Success                 │
│    │ [View Details]                     │
│                                          │
└──────────────────────────────────────────┘
```

### 4.5 Cleanup Settings

```
⚙️ CLEANUP CONFIGURATION
┌──────────────────────────────────────────┐
│ RETENTION POLICIES                       │
│                                          │
│ Payment Screenshots (Completed Orders)   │
│ └─ Keep for: [90 ▼] days               │
│                                          │
│ Order Documents (After Delivery)        │
│ └─ Keep for: [30 ▼] days               │
│                                          │
│ Support Ticket Attachments              │
│ └─ Keep for: [60 ▼] days               │
│    After ticket: [Closed ▼]             │
│                                          │
│ Inactive User Media                     │
│ └─ Keep for: [365 ▼] days              │
│    If user inactive for: [180 ▼] days  │
│                                          │
│ Recycle Bin Recovery Period             │
│ └─ Keep for: [30 ▼] days               │
│                                          │
├──────────────────────────────────────────┤
│ AUTOMATIC CLEANUP SCHEDULE               │
│                                          │
│ ✓ Enable Automatic Cleanup              │
│                                          │
│ Daily Cleanup                           │
│ └─ Time: [02:00 ▼] UTC                 │
│                                          │
│ Weekly Deep Cleanup                     │
│ └─ Day: [Sunday ▼]  Time: [03:00 ▼]    │
│                                          │
│ Monthly Audit                           │
│ └─ Day: [1st ▼]  Time: [04:00 ▼]       │
│                                          │
├──────────────────────────────────────────┤
│ NOTIFICATIONS                            │
│                                          │
│ ✓ Notify on cleanup completion         │
│ ✓ Alert if cleanup fails                │
│ ✓ Weekly storage report                 │
│ ☐ Monthly detailed analysis             │
│                                          │
├──────────────────────────────────────────┤
│ [Save Settings] [Reset to Default]      │
└──────────────────────────────────────────┘
```

### 4.6 Storage Analytics Dashboard

```
📊 STORAGE ANALYTICS
┌──────────────────────────────────────────┐
│ STORAGE TREND (Last 12 Months)          │
│                                          │
│ MB  ▕                                   │
│ 500 ▕                    ╱╲             │
│ 450 ▕   ╱╲    ╱╲    ╱╲ ╱  ╲             │
│ 400 ▕  ╱  ╲  ╱  ╲  ╱  ╲    ╲             │
│ 350 ▕ ╱    ╲╱    ╲╱    ╲    ╲            │
│ 300 ▕                    ╲    ╲           │
│     └────┴────┴────┴────┴────┴──► Months│
│       J  F  M  A  M  J  J  A  S  O  N  D│
│                                          │
│ Current: 450 MB (88%)                   │
│ Growth Rate: +15 MB/month               │
│ Projected Full: Sep 2025                │
└──────────────────────────────────────────┘

TOP CATEGORIES BY SIZE
┌──────────────────────────────────────────┐
│ Product Images:      280 MB (62%)  ▓▓▓  │
│ Payment Screenshots: 100 MB (22%)  ▓    │
│ Order Documents:     45 MB (10%)   ▒    │
│ Support Tickets:     15 MB (3%)    ░    │
│ User Profiles:       10 MB (2%)    ░    │
└──────────────────────────────────────────┘

FILE SIZE DISTRIBUTION
┌──────────────────────────────────────────┐
│ <1 MB:      1200 files (49%)            │
│ 1-5 MB:     845 files (35%)             │
│ 5-10 MB:    245 files (10%)             │
│ 10-50 MB:   145 files (6%)              │
│ >50 MB:     15 files (1%)               │
└──────────────────────────────────────────┘

RECOMMENDATIONS
┌──────────────────────────────────────────┐
│ ⚠️  Storage at 88% capacity              │
│     Consider upgrading cluster           │
│                                          │
│ 💡  245 orphaned files found (12 MB)    │
│     [Quick Clean] or [Review]           │
│                                          │
│ ℹ️  Next cleanup: Tomorrow 2 AM          │
│     Est. to free: ~45 MB                │
│                                          │
│ 📈  Growth trend: +15 MB/month          │
│     At this rate, full in 4 months      │
└──────────────────────────────────────────┘
```

---

## 🔐 Part 5: Backend Implementation Structure

### 5.1 File Structure

```
lib/
├── mediaStorage.ts           # Core media operations
├── mediaCleanup.ts           # Cleanup logic & scheduling
├── mediaMetadata.ts          # Metadata management
└── recycleBin.ts             # Recycle bin operations

app/api/media/
├── upload/route.ts           # Upload endpoint
├── metadata/route.ts         # Get metadata
├── delete/route.ts           # Soft delete
├── recycle-bin/
│   ├── route.ts              # List recycle bin
│   ├── recover/route.ts      # Recover files
│   └── empty/route.ts        # Empty recycle bin
├── cleanup/
│   ├── route.ts              # Manual cleanup
│   ├── logs/route.ts         # Cleanup logs
│   └── schedule/route.ts     # Scheduling
└── analytics/route.ts        # Storage stats

components/admin/
├── MediaDashboard.tsx        # Main dashboard
├── ManualCleanup.tsx         # Cleanup interface
├── RecycleBin.tsx            # Recycle bin UI
├── CleanupLogs.tsx           # History & logs
├── StorageAnalytics.tsx      # Analytics
└── CleanupSettings.tsx       # Configuration

models/
├── MediaMetadata.ts          # Schema
├── DeletedMedia.ts           # Schema
└── CleanupLog.ts             # Schema
```

---

## 🚀 Part 6: Implementation Priority

### Phase 1 (Week 1): Foundation
- [ ] Database schemas
- [ ] Media metadata tracking
- [ ] Basic upload with metadata
- [ ] Storage status API

### Phase 2 (Week 2): Manual Management
- [ ] Soft delete functionality
- [ ] Recycle bin storage
- [ ] Recovery endpoint
- [ ] Admin cleanup interface

### Phase 3 (Week 3): Automation
- [ ] Cleanup scheduling
- [ ] Automatic rules engine
- [ ] Cron jobs
- [ ] Cleanup logs

### Phase 4 (Week 4): Analytics & Polish
- [ ] Storage analytics
- [ ] Dashboard UI
- [ ] Settings management
- [ ] Notifications

---

## ✅ Key Features Summary

```
✓ Automatic monthly cleanup based on rules
✓ Soft delete with 30-day recovery period
✓ Recycle bin with countdown to permanent deletion
✓ One-by-one or bulk deletion
✓ Manual cleanup with category selection
✓ Cleanup history & logs tracking
✓ Storage analytics & recommendations
✓ Configurable retention policies
✓ Payment screenshot lifecycle management
✓ Support ticket attachment cleanup
✓ Orphaned file detection & removal
✓ Duplicate file consolidation
✓ User activity-based cleanup
✓ Admin notifications & alerts
✓ Full audit trail of all deletions
```

---

## 📋 Testing Checklist

- [ ] Upload creates metadata correctly
- [ ] Soft delete moves to recycle bin
- [ ] Recovery restores original location
- [ ] Permanent delete removes GridFS file
- [ ] Cleanup jobs run on schedule
- [ ] Rules correctly identify files
- [ ] Bulk operations work without errors
- [ ] Analytics calculations accurate
- [ ] Orphaned files detected
- [ ] Duplicate detection working
- [ ] 30-day deadline enforced
- [ ] Admin can manually trigger cleanup
- [ ] Notifications sent correctly
- [ ] Logs recorded accurately

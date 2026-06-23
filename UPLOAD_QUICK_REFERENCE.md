# Upload System - Quick Reference Guide

## 📦 Components Location
```
components/Upload/
├── UploadService.ts              # Core upload logic
├── UploadProgress.tsx            # Progress bar component
├── FilePreviewCard.tsx           # File card component
├── DragDropUploader.tsx          # Main upload interface
├── UploadStyles.module.css       # All styling
└── index.ts                      # Barrel export
```

## 🚀 Quick Start

### 1. Import Component
```typescript
import { DragDropUploader } from '@/components/Upload';
```

### 2. Use in Your Page
```typescript
<DragDropUploader
  endpoint="/api/upload"
  allowedFileTypes={['.jpg', '.png', '.mp4']}
  maxFileSize={100}
  onUploadComplete={(results) => console.log(results)}
  onError={(error) => alert(error)}
/>
```

### 3. That's It! 🎉

## 📋 Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endpoint` | string | required | API endpoint URL for upload |
| `allowedFileTypes` | string[] | required | File extensions: `['.jpg', '.png']` |
| `maxFileSize` | number | 100 | Max file size in MB |
| `maxTotalFiles` | number | 20 | Max files per upload session |
| `sequential` | boolean | false | Upload one-by-one (true) or parallel (false) |
| `onUploadComplete` | function | - | Called when all uploads finish |
| `onError` | function | - | Called on validation or upload error |

## 🎨 Styling

CSS is scoped using CSS Modules - no conflicts with global styles.

To customize colors:
```css
/* In UploadStyles.module.css */
.dragDropZone:hover {
  border-color: #YourColor;
}
.progressBar {
  background: linear-gradient(90deg, #Color1 0%, #Color2 100%);
}
```

## 📱 Responsive Breakpoints

```
Desktop  (900px+) : Full grid, 3-4 cards per row
Tablet   (768px)  : 2-3 cards per row
Mobile   (<480px) : 1 card per row (stacked)
```

## ✅ File Type Examples

```typescript
// Images only
['.jpg', '.jpeg', '.png', '.webp']

// Videos only
['.mp4', '.webm', '.mov', '.avi']

// Mixed
['.jpg', '.png', '.mp4', '.webm']

// Documents
['.pdf', '.doc', '.docx']
```

## 🔄 Upload States

```
Waiting    ⏳  → Pending upload
Uploading  🔄  → Currently uploading
Processing ⚙️   → Post-upload processing (video encoding, etc.)
Completed  ✓   → Upload successful
Failed     ✕   → Upload failed, user can retry
```

## 📊 Progress Data

```typescript
interface UploadProgressData {
  fileId: string;              // Unique file ID
  fileName: string;            // File name
  fileSize: number;            // File size in bytes
  loaded: number;              // Bytes uploaded
  total: number;               // Total bytes
  percentage: number;          // 0-100%
  uploadSpeed: number;         // Bytes per second
  estimatedTimeRemaining: number; // Seconds
  status: UploadStatus;        // Current status
  error?: string;              // Error message if failed
  response?: any;              // Server response
}
```

## 🛠️ UploadService Methods

```typescript
import UploadService from '@/components/Upload/UploadService';

// Validate file type
UploadService.validateFileType(file, ['.jpg', '.png']);

// Validate file size
UploadService.validateFileSize(file, 100); // 100MB

// Format bytes
UploadService.formatBytes(1048576); // "1 MB"

// Format speed
UploadService.formatSpeed(1024000); // "1000 KB/s"

// Format time
UploadService.formatTime(120); // "2m"

// Get preview URL
const url = UploadService.getFilePreview(file);

// Revoke preview URL
UploadService.revokeFilePreview(url);
```

## 🎯 Usage Examples

### Example 1: Basic Upload
```typescript
<DragDropUploader
  endpoint="/api/upload"
  allowedFileTypes={['.jpg', '.png']}
  onUploadComplete={(results) => {
    console.log('Done!', results);
  }}
/>
```

### Example 2: With Error Handling
```typescript
<DragDropUploader
  endpoint="/api/upload"
  allowedFileTypes={['.jpg', '.png']}
  maxFileSize={50}
  onError={(error) => {
    console.error('Error:', error);
    // Show user-friendly message
  }}
  onUploadComplete={(results) => {
    const successful = results.filter(r => r.status === 'completed').length;
    console.log(`${successful} files uploaded`);
  }}
/>
```

### Example 3: Sequential Upload
```typescript
<DragDropUploader
  endpoint="/api/upload"
  allowedFileTypes={['.jpg']}
  sequential={true} // Upload one at a time
/>
```

### Example 4: Single File (Payment Proof)
```typescript
import PaymentProofUpload from '@/components/Upload/PaymentProofUpload';

<PaymentProofUpload
  orderId="ORD-123"
  transactionId="TXN-456"
  onUploadSuccess={(data) => {
    // Handle success
  }}
/>
```

## 🔍 Debugging

### Check Browser Console
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG_UPLOAD', 'true');
```

### Common Errors
```
❌ "Invalid file type"
   → Check allowedFileTypes prop

❌ "File size exceeds X MB"
   → Check maxFileSize prop

❌ "Upload failed"
   → Check API endpoint URL
   → Check CORS configuration
   → Check server logs

❌ "NetworkError"
   → Check internet connection
   → Check API availability
```

## 📡 Backend Requirements

Your API endpoint should:
1. Accept `multipart/form-data`
2. Return JSON response with success status
3. Handle file size validation
4. Store file securely

```typescript
// Minimum API response
{
  success: true,
  fileId: "abc123",
  fileName: "image.jpg",
  size: 1024000
}
```

## 🎬 Status Flow

```
User selects files
        ↓
Validation (type, size)
        ↓
[Queue: Waiting] ⏳
        ↓
[Start Upload: Uploading] 🔄 (progress 0-100%)
        ↓
[Processing] ⚙️ (optional, for video encoding)
        ↓
[Completed] ✓ (or Failed ✕ with retry option)
```

## 💡 Pro Tips

1. **Mobile First:** Test on actual mobile devices
2. **Large Files:** Use sequential upload for files >50MB
3. **Video Upload:** Show "Processing..." state for encoding
4. **Retry Logic:** Implement automatic retry after network errors
5. **User Feedback:** Always show upload progress
6. **Cleanup:** Remove old uploads periodically
7. **Analytics:** Track upload success/failure rates

## ⚡ Performance

- Parallel uploads: 3 concurrent (default)
- Progress updates: Every 300ms
- Preview URLs: Auto-revoked to prevent memory leaks
- File preview generation: Instant for images, ~1s for videos

## 🔒 Security Checklist

- [ ] Validate file types on backend (don't trust client)
- [ ] Enforce max file size on backend
- [ ] Authenticate user before upload
- [ ] Scan files for malware (optional)
- [ ] Implement rate limiting
- [ ] Configure CORS properly

## 📞 Need Help?

Check these files:
- `UPLOAD_IMPLEMENTATION_GUIDE.md` - Detailed guide
- `UPLOAD_EXAMPLE_ADMIN.tsx` - Admin example
- `UPLOAD_EXAMPLE_PAYMENT_PROOF.tsx` - Payment proof example
- `UploadService.ts` - API documentation in comments

---

**Version:** 1.0.0  
**Updated:** 2026-06-23  
**Status:** Production Ready ✅

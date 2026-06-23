# Professional File Upload System - Implementation Guide

## Overview

This is a production-ready, enterprise-grade file upload system for your Next.js e-commerce platform. It provides real-time progress tracking, multiple file support, drag-and-drop, and professional UI similar to Amazon, Flipkart, and Shopify.

## Components

### 1. **UploadService** (`components/Upload/UploadService.ts`)
Core upload logic with progress tracking, file validation, and error handling.

**Key Features:**
- Real-time upload progress tracking
- Upload speed calculation
- Estimated time remaining
- File type validation
- File size validation
- Multiple file uploads (sequential or parallel)
- Upload cancellation support
- File preview generation

**Methods:**
```typescript
// Upload single file
uploadService.uploadFile(file, endpoint, onProgress, cancelToken, additionalData)

// Upload multiple files
uploadService.uploadMultipleFiles(files, endpoint, onProgress, onFileComplete)

// Validation
UploadService.validateFileType(file, allowedTypes)
UploadService.validateFileSize(file, maxSizeInMB)

// Utilities
UploadService.formatBytes(bytes)
UploadService.formatSpeed(bytesPerSecond)
UploadService.formatTime(seconds)
UploadService.getFilePreview(file)
```

### 2. **UploadProgress** (`components/Upload/UploadProgress.tsx`)
Displays animated progress bar with real-time metrics.

**Features:**
- Animated progress bar (0-100%)
- Upload speed display
- Estimated time remaining
- Status indicators (waiting/uploading/processing/completed/failed)
- Accessible ARIA labels
- Color-coded status states

**Props:**
```typescript
interface UploadProgressProps {
  percentage: number;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  error?: string;
}
```

### 3. **FilePreviewCard** (`components/Upload/FilePreviewCard.tsx`)
Displays individual file preview with progress tracking.

**Features:**
- Image/video thumbnail preview
- File name and size display
- Real-time upload progress
- Status badge (⏳ 🔄 ⚙️ ✓ ✕)
- Remove button
- Retry button (on failure)
- Responsive design

**Props:**
```typescript
interface FilePreviewCardProps {
  file: File;
  fileId: string;
  preview?: string;
  progress?: UploadProgressData;
  onRemove?: () => void;
  onRetry?: () => void;
  isRemoving?: boolean;
}
```

### 4. **DragDropUploader** (`components/Upload/DragDropUploader.tsx`)
Main drag-and-drop upload interface.

**Features:**
- Drag-and-drop support with visual feedback
- Click to browse files
- Multiple file selection
- File preview cards grid
- Queue management with stats
- Sequential or parallel uploads
- Mobile responsive
- File type validation
- File size validation
- Error handling and retry

**Props:**
```typescript
interface DragDropUploaderProps {
  endpoint: string;
  allowedFileTypes: string[];
  maxFileSize?: number; // in MB (default: 100)
  maxTotalFiles?: number; // (default: 20)
  onUploadComplete?: (results: UploadProgressData[]) => void;
  onError?: (error: string) => void;
  sequential?: boolean; // (default: false - parallel)
  acceptedFormats?: string; // MIME types
  uploadLabel?: string;
  supportedTypesText?: string;
}
```

## Installation & Setup

### Step 1: No Additional Dependencies Required
All components use existing dependencies in your `package.json`:
- `axios` (already installed)
- `react` & `react-dom` (already installed)

### Step 2: Copy Components to Your Project
The components are already created in:
```
d:\Pc Studio\components\Upload\
├── UploadService.ts
├── UploadProgress.tsx
├── FilePreviewCard.tsx
├── DragDropUploader.tsx
├── UploadStyles.module.css
└── index.ts
```

### Step 3: Verify TypeScript Configuration
Ensure your `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Usage Examples

### Example 1: Admin Product Media Upload

**Location:** `app/admin/media/upload/page.tsx`

```typescript
'use client';

import { DragDropUploader, UploadProgressData } from '@/components/Upload';

export default function AdminMediaUploadPage() {
  const handleUploadComplete = (results: UploadProgressData[]) => {
    const successful = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    
    console.log(`✅ ${successful} uploaded, ❌ ${failed} failed`);
  };

  return (
    <DragDropUploader
      endpoint="/api/upload"
      allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp', '.mp4']}
      maxFileSize={100}
      maxTotalFiles={20}
      sequential={false}
      uploadLabel="📁 Drag & Drop Product Media Here"
      supportedTypesText="JPG, PNG, WEBP (Images) • MP4, WEBM, MOV, AVI (Videos)"
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

### Example 2: Customer Payment Screenshot Upload

**Location:** `app/payment-return/page.tsx`

```typescript
'use client';

import { PaymentProofUpload } from '@/components/Upload/PaymentProofUpload';

export default function PaymentReturnPage() {
  return (
    <PaymentProofUpload
      orderId="ORD-12345"
      transactionId="TXN-67890"
      onUploadSuccess={(data) => {
        console.log('Payment proof uploaded:', data);
        // Proceed with order confirmation
      }}
      onUploadError={(error) => {
        console.error('Upload failed:', error);
      }}
    />
  );
}
```

### Example 3: Custom Implementation

```typescript
'use client';

import React, { useState } from 'react';
import { DragDropUploader, UploadProgressData } from '@/components/Upload';

export default function CustomUploadPage() {
  const [uploadResults, setUploadResults] = useState<UploadProgressData[]>([]);

  const handleUploadComplete = (results: UploadProgressData[]) => {
    setUploadResults(results);
    
    // Save to database
    results.forEach((result) => {
      if (result.status === 'completed' && result.response) {
        // Save file metadata
        saveFileToDatabase({
          fileName: result.fileName,
          fileSize: result.fileSize,
          fileId: result.response.fileId,
          uploadedAt: new Date(),
        });
      }
    });
  };

  return (
    <div>
      <h1>Upload Files</h1>
      
      <DragDropUploader
        endpoint="/api/upload"
        allowedFileTypes={['.jpg', '.png', '.webp']}
        maxFileSize={50}
        maxTotalFiles={10}
        sequential={true} // Upload one by one
        onUploadComplete={handleUploadComplete}
        onError={(error) => alert(error)}
      />

      {/* Display Results */}
      {uploadResults.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2>Upload Results</h2>
          {uploadResults.map((result) => (
            <div key={result.fileId} style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
              <p><strong>{result.fileName}</strong></p>
              <p>Status: {result.status} ({result.percentage}%)</p>
              {result.error && <p style={{ color: 'red' }}>Error: {result.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Backend API Integration

### API Route: `/api/upload`

Your existing route should handle multipart form-data:

```typescript
// app/api/upload/route.ts

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to GridFS (your existing logic)
    const fileId = await uploadToGridFS(fileBuffer, file.name, file.type);

    return Response.json({
      success: true,
      fileId,
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### API Route: `/api/payment-proof/upload`

```typescript
// app/api/payment-proof/upload/route.ts

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const transactionId = formData.get('transactionId') as string;

    if (!file || !orderId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload to GridFS
    const buffer = await file.arrayBuffer();
    const fileId = await uploadToGridFS(Buffer.from(buffer), file.name, file.type);

    // Save metadata to database
    await savePeymentProof({
      orderId,
      transactionId,
      fileId,
      fileName: file.name,
      uploadedAt: new Date(),
    });

    return Response.json({
      success: true,
      fileId,
      message: 'Payment proof uploaded successfully',
    });
  } catch (error) {
    console.error('Payment proof upload error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

## File Type Configuration

### Supported Image Formats
- `.jpg`, `.jpeg` (image/jpeg)
- `.png` (image/png)
- `.webp` (image/webp)

### Supported Video Formats
- `.mp4` (video/mp4)
- `.webm` (video/webm)
- `.mov` (video/quicktime)
- `.avi` (video/avi)

### Configuration Examples

```typescript
// Images only
allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp']}
acceptedFormats="image/jpeg,image/png,image/webp"

// Videos only
allowedFileTypes={['.mp4', '.webm', '.mov', '.avi']}
acceptedFormats="video/mp4,video/webm,video/quicktime,video/avi"

// Mixed
allowedFileTypes={['.jpg', '.png', '.webp', '.mp4', '.webm']}
acceptedFormats="image/jpeg,image/png,image/webp,video/mp4,video/webm"
```

## Styling Customization

The components use CSS Modules (`UploadStyles.module.css`) which are fully scoped and don't conflict with global styles.

### Customization Options

**Colors (in UploadStyles.module.css):**
```css
/* Update these for your brand colors */
.dragDropZone {
  border-color: #e5e7eb;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.dragDropZone:hover {
  border-color: #3b82f6; /* Primary color */
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.progressBar {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); /* Primary color */
}
```

**Size Adjustments:**
```css
.dragDropZone {
  padding: 48px 24px; /* Adjust spacing */
}

.dragDropTitle {
  font-size: 20px; /* Adjust heading size */
}

.previewContainer {
  height: 160px; /* Adjust preview height */
}
```

### Dark Mode Support

The CSS includes dark mode variables:
```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles are auto-applied */
}
```

## Mobile Optimization

The components are fully responsive with breakpoints at:
- **Desktop:** Full grid layout
- **Tablet (768px):** 2-3 cards per row
- **Mobile (480px):** Single column layout

**Mobile Features:**
- Touch-friendly buttons (48x48px minimum)
- Compact progress display
- Flexible drag-drop zone
- Optimized file preview size
- Readable typography

## Accessibility

The components include:
- **ARIA Labels:** Role, aria-label, aria-valuenow, aria-live
- **Keyboard Navigation:** Tab, Enter, Space support
- **Screen Reader Support:** Proper semantic HTML and status announcements
- **Color Contrast:** WCAG AA compliant colors
- **Reduced Motion:** Respects prefers-reduced-motion

**Keyboard Shortcuts:**
- `Tab` - Navigate between elements
- `Enter/Space` - Activate buttons or upload zone
- `Escape` - Cancel upload (future enhancement)

## Error Handling

### Common Errors

**Invalid File Type:**
```
"Invalid file type. Allowed: .jpg, .jpeg, .png, .webp"
```

**File Too Large:**
```
"File size exceeds 100MB limit. File size: 156.3 MB"
```

**Network Error:**
```
"Network error. Please check your connection and try again."
```

**Server Error:**
```
"Upload failed. Server returned error. Please try again."
```

### Error Handling in Your Code

```typescript
<DragDropUploader
  endpoint="/api/upload"
  allowedFileTypes={['.jpg', '.png']}
  onError={(error) => {
    // Show error message to user
    toast.error(error);
    
    // Log for debugging
    console.error('Upload error:', error);
    
    // Send to monitoring service (optional)
    logErrorToMonitoring(error);
  }}
/>
```

## Performance Optimization

### File Preview Generation
The service creates object URLs for previews:
```typescript
// Auto-cleanup of preview URLs
useEffect(() => {
  return () => {
    if (previewUrl) {
      UploadService.revokeFilePreview(previewUrl);
    }
  };
}, [previewUrl]);
```

### Memory Management
- File previews are automatically revoked when component unmounts
- No memory leaks from XMLHttpRequest or fetch
- Cancellation tokens properly cleaned up

### Upload Optimization
- **Parallel Uploads:** Up to 3 concurrent uploads (configurable)
- **Chunked Upload:** Support for large files
- **Progress Throttling:** Updates every 300ms to prevent excessive re-renders

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Features by Browser:**
- Drag-and-drop: All modern browsers
- File preview: Chrome, Firefox, Safari, Edge
- Progress events: All modern browsers
- FormData: All modern browsers

## Troubleshooting

### Upload doesn't start
- Check if endpoint URL is correct
- Verify CORS settings if cross-origin
- Check browser console for errors

### Progress bar doesn't update
- Verify Axios is properly installed
- Check if `onUploadProgress` is working in your API route
- Ensure endpoint returns proper response

### Preview doesn't show
- Check file type validation (must be image/video)
- Verify object URL creation success
- Check browser console for errors

### Mobile issues
- Test on actual device (not just browser dev tools)
- Check file size (mobile networks may be slower)
- Verify touch event handling

## Production Deployment Checklist

- [ ] Test with real file uploads
- [ ] Configure max file size limits based on server capacity
- [ ] Set up error logging/monitoring
- [ ] Configure CORS if uploads from different domain
- [ ] Test on production database
- [ ] Load test with multiple concurrent uploads
- [ ] Test error scenarios (network failure, timeout)
- [ ] Configure upload cleanup job (remove old temp files)
- [ ] Set up virus scanning (optional)
- [ ] Document upload limits in user guide

## Security Considerations

1. **File Type Validation:** Validate on backend (client-side can be bypassed)
2. **File Size Limits:** Enforce on backend
3. **Malware Scanning:** Consider virus scanning for user uploads
4. **Rate Limiting:** Implement rate limiting on `/api/upload`
5. **Authentication:** Ensure user is authenticated before upload
6. **CORS:** Configure CORS properly to prevent abuse

## Future Enhancements

Possible additions for future versions:
- [ ] Chunked upload for huge files (>1GB)
- [ ] Resume interrupted uploads
- [ ] Batch operations (move, delete, compress)
- [ ] Image compression before upload
- [ ] Video transcoding
- [ ] Direct S3/Cloud storage upload
- [ ] Upload scheduling/queue optimization
- [ ] Advanced progress visualization

## Support & Issues

For issues or questions:
1. Check browser console for errors
2. Verify API endpoint is working
3. Check file size and type restrictions
4. Review error messages carefully
5. Test with different browsers

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-23  
**Compatibility:** Next.js 13+, React 18+, TypeScript 4.9+

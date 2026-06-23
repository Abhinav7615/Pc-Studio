# Upload System - Testing & Troubleshooting Guide

## 🧪 Testing Scenarios

### Test 1: Basic File Upload (Single Image)

**Objective:** Verify single file upload works correctly

**Steps:**
1. Navigate to upload page
2. Select a JPG/PNG image (< 10MB)
3. Verify preview appears
4. Verify progress bar shows 0-100%
5. Verify success state appears
6. Check server received the file

**Expected Result:** ✅ Upload completes, file saved on server

**Common Issues:**
```
❌ Preview doesn't show
   - Verify file is valid image format
   - Check browser console for errors

❌ Progress doesn't update
   - Verify API endpoint is reachable
   - Check server is sending progress events

❌ Upload fails silently
   - Check browser Network tab
   - Verify API endpoint URL is correct
```

---

### Test 2: Multiple File Upload

**Objective:** Verify multiple files upload correctly

**Steps:**
1. Select 3-5 images at once
2. Verify all appear as cards
3. Verify each shows individual progress
4. Verify queue counter updates (Total: 5, Uploading: 2, etc.)
5. Verify all complete successfully or show individual errors
6. Verify uploaded count matches

**Expected Result:** ✅ All files upload, queue updates in real-time

---

### Test 3: File Validation (Invalid Type)

**Objective:** Verify invalid file types are rejected

**Steps:**
1. Try uploading a `.txt` or `.pdf` file
2. Verify error message appears before upload starts
3. Verify error says "Invalid file type"
4. Verify file is not added to upload queue

**Expected Result:** ✅ Upload rejected, error message shown

---

### Test 4: File Validation (Too Large)

**Objective:** Verify large files are rejected

**Steps:**
1. Create a 150MB file or use large video
2. Set max file size to 100MB
3. Try uploading
4. Verify error appears with file size info
5. Verify file is not uploaded

**Expected Result:** ✅ Upload rejected, error shows actual size

---

### Test 5: Drag and Drop

**Objective:** Verify drag-drop functionality

**Steps:**
1. Drag an image onto upload zone
2. Verify zone highlights on drag
3. Verify file is added on drop
4. Verify preview appears

**Expected Result:** ✅ Drag-drop works smoothly with visual feedback

---

### Test 6: Progress Accuracy

**Objective:** Verify progress percentage is accurate

**Steps:**
1. Upload a moderately-sized file (5-20MB)
2. Watch progress percentage
3. Verify it goes from 0% to 100%
4. Verify it doesn't jump from 0% to 100% instantly (unless file is tiny)
5. Verify speed and time remaining display

**Expected Result:** ✅ Progress shows accurate data

---

### Test 7: Error Recovery

**Objective:** Verify user can retry failed uploads

**Steps:**
1. Upload a file
2. Simulate network error (DevTools Network tab > Offline)
3. Verify upload fails with error message
4. Click retry button
5. Go back online
6. Verify upload succeeds on retry

**Expected Result:** ✅ Retry successfully uploads file

---

### Test 8: Upload Cancellation

**Objective:** Verify user can cancel ongoing uploads

**Steps:**
1. Start uploading a large file
2. Click cancel/remove button
3. Verify upload stops
4. Verify file is removed from queue
5. Verify network request is aborted

**Expected Result:** ✅ Upload cancelled, server not sent

---

### Test 9: Mobile Responsiveness

**Objective:** Verify upload works on mobile devices

**Steps (Android):**
1. Open page on Android phone
2. Verify upload zone is visible
3. Click to browse files
4. Select image from camera/gallery
5. Verify upload works
6. Verify cards stack vertically
7. Verify buttons are touch-friendly (48x48px minimum)

**Steps (iOS):**
1. Open page on iPhone
2. Click upload zone
3. Choose from Photos or Files
4. Upload image
5. Verify UI is responsive

**Expected Result:** ✅ Upload works on mobile with proper layout

---

### Test 10: Accessibility

**Objective:** Verify keyboard navigation and screen reader support

**Steps:**
1. Open page in browser
2. Press Tab to navigate upload zone
3. Press Enter/Space to activate
4. Upload a file
5. Verify ARIA labels in browser dev tools
6. Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)

**Expected Result:** ✅ Keyboard navigation works, screen reader announces status

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid file type" for valid images

**Symptoms:**
```
❌ Error: "Invalid file type. Allowed: .jpg, .jpeg, .png"
```

**Causes:**
- File extension not matching allowed types
- MIME type not matching
- File is corrupted/invalid

**Solutions:**
```typescript
// Check: Are you using correct file types?
allowedFileTypes={['.jpg', '.jpeg', '.png']} ✅

// NOT
allowedFileTypes={['jpg', 'jpeg', 'png']} ❌

// Verify file extension
const fileName = file.name; // "photo.JPG"
const ext = fileName.split('.').pop().toLowerCase(); // "jpg"
```

**Debug:**
```javascript
// In browser console
const file = document.querySelector('input[type="file"]').files[0];
console.log('Name:', file.name);
console.log('Type:', file.type);
console.log('Size:', file.size);
```

---

### Issue 2: Progress doesn't update

**Symptoms:**
```
⏳ Stuck at 0% or jumps to 100%
```

**Causes:**
- API not sending progress events
- Axios not configured correctly
- Network issue

**Solutions:**

1. **Verify API sends progress events:**
```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  // Progress events work with streams, not FormData in Next.js
  // Use NextResponse streaming
}
```

2. **Check browser Network tab:**
   - Open DevTools > Network
   - Upload a file
   - Click the upload request
   - Check if response has `Transfer-Encoding: chunked`
   - Verify bytes are being transferred

3. **Test with different browser:**
   - Some browsers handle progress differently
   - Try Chrome, Firefox, Safari

---

### Issue 3: Upload works locally but fails in production

**Symptoms:**
```
❌ Works in dev, fails in prod
```

**Causes:**
- CORS configuration
- Different server/environment
- Large file size limit
- Network timeout

**Solutions:**

1. **Check CORS headers:**
```typescript
// API should return these headers
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

2. **Increase server timeout:**
```typescript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};
```

3. **Test upload size:**
   - Start with small file (< 1MB)
   - Gradually increase size
   - Find the breaking point

4. **Check server logs:**
```bash
# View server logs
tail -f /var/log/nginx/error.log
```

---

### Issue 4: Memory leak or slow performance

**Symptoms:**
```
💾 Browser using too much memory
⚠️ Page slows down after multiple uploads
```

**Causes:**
- Preview URLs not cleaned up
- Event listeners not removed
- Large file still in memory

**Solutions:**

1. **Verify cleanup:**
```typescript
// Component should cleanup on unmount
useEffect(() => {
  return () => {
    // Cleanup preview URLs
    previewUrls.forEach(url => UploadService.revokeFilePreview(url));
  };
}, []);
```

2. **Limit concurrent uploads:**
```typescript
<DragDropUploader
  sequential={true} // Upload one at a time
  // or
  // Modify DragDropUploader to limit parallel uploads to 1-2
/>
```

3. **Reduce file preview size:**
   - Don't create preview for large files
   - Use video thumbnail instead of full video

---

### Issue 5: CORS errors

**Symptoms:**
```
❌ Access to XMLHttpRequest blocked by CORS
```

**Causes:**
- Uploading from different domain
- Server CORS not configured
- API endpoint doesn't handle CORS

**Solutions:**

1. **Enable CORS in API route:**
```typescript
// app/api/upload/route.ts
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

2. **Use same-origin uploads:**
   - If possible, upload to same domain
   - Use relative URLs: `/api/upload` instead of `https://...`

3. **Use middleware for CORS:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
```

---

### Issue 6: File appears uploaded but not saved

**Symptoms:**
```
✅ Progress shows 100%, but file not on server
```

**Causes:**
- API returns success but doesn't save
- Server path issue
- Permission denied
- Disk full

**Solutions:**

1. **Check server-side save logic:**
```typescript
// app/api/upload/route.ts
// Add logging
console.log('Received file:', file.name);
console.log('Saving to:', uploadPath);

const result = await uploadToGridFS(buffer, file.name);
console.log('Save result:', result);

// Return detailed response
return Response.json({
  success: true,
  fileId: result._id,
  message: 'File saved successfully',
});
```

2. **Check disk space:**
```bash
df -h  # Check available space
du -sh /path/to/uploads  # Check folder size
```

3. **Check file permissions:**
```bash
ls -la /path/to/uploads/
chmod 755 /path/to/uploads/
```

---

## 🔍 Debugging Checklist

### Enable Debug Mode
```typescript
// In your component
const [debug, setDebug] = useState(true);

if (debug) {
  console.log('Upload progress:', progress);
  console.log('Files:', uploadedFiles);
}
```

### Browser DevTools

1. **Network Tab:**
   - Watch upload request
   - Check response status (200, 400, 500)
   - Verify request headers
   - Monitor response size

2. **Console Tab:**
   - Check for JavaScript errors
   - Look for network warnings
   - Add custom logging

3. **Application Tab:**
   - Check localStorage (debugging info)
   - Check IndexedDB (cached uploads)

### Server Logs

```bash
# View application logs
tail -f /var/log/app.log

# Check for errors
grep -i error /var/log/app.log

# Monitor real-time
watch -n 1 "grep -i upload /var/log/app.log | tail -20"
```

---

## ✅ Pre-Deployment Checklist

- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] File validation works (type and size)
- [ ] Progress bar updates correctly
- [ ] Drag-drop functionality works
- [ ] Error handling displays proper messages
- [ ] Retry mechanism works
- [ ] Mobile layout is responsive
- [ ] Keyboard navigation works
- [ ] Screen reader announces status
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Works on iOS and Android
- [ ] Upload works with slow network (test in DevTools Throttling)
- [ ] Upload works with large files
- [ ] Upload cancellation works
- [ ] Server saves files correctly
- [ ] File paths are secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is implemented
- [ ] Error logging is working

---

## 🧪 Manual Test Cases

### Test Data

```javascript
// Create test files programmatically
const createTestFile = (name, size, type) => {
  const array = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return new File([array], name, { type });
};

// Test 1MB image
const file1MB = createTestFile('test1MB.jpg', 1024 * 1024, 'image/jpeg');

// Test 100MB image
const file100MB = createTestFile('test100MB.jpg', 100 * 1024 * 1024, 'image/jpeg');

// Test invalid type
const fileTxt = createTestFile('test.txt', 1024, 'text/plain');
```

### Network Simulation

```javascript
// Simulate slow network
// DevTools > Network > Throttling > Slow 3G

// Simulate offline
// DevTools > Network > Offline

// Simulate timeout
// In UploadService, add delay: await new Promise(r => setTimeout(r, 60000))
```

---

## 📊 Performance Benchmarks

Expected performance on standard hardware:

| Test | Expected Result |
|------|-----------------|
| 1MB file upload | < 2 seconds |
| 10MB file upload | 5-15 seconds (depends on network) |
| 100MB file upload | 30-120 seconds (depends on network) |
| Progress updates | Every 300ms |
| File preview generation | < 100ms |
| Multiple file processing | 50-100ms per file |

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-23  
**Status:** Production Ready ✅

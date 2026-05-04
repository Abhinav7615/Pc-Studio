# Dynamic Branding System - Implementation Guide

This guide explains how to implement dynamic logo/icon updates that can be controlled from the admin panel.

## 🎨 Current System

The current implementation stores branding in MongoDB (`BusinessSettings` model) and allows admins to update:
- Website name
- Website subtitle
- Logo (header logo)
- Dark logo (dark mode logo)
- Favicon

## 📱 PWA Icon Update System

### Overview

The PWA icon system needs to work with your dynamic branding. Here's how to implement it:

### Step 1: Extend Business Settings Model

```typescript
// models/BusinessSettings.ts - Add these fields

const BusinessSettingsSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // PWA Icons
  pwaIcon192: { type: String }, // URL to 192x192 icon
  pwaIcon512: { type: String }, // URL to 512x512 icon
  pwaIcon192Maskable: { type: String }, // URL to maskable 192x192
  pwaIcon512Maskable: { type: String }, // URL to maskable 512x512
  pwaThemeColor: { type: String, default: '#1e3a8a' },
  pwaBackgroundColor: { type: String, default: '#0f172a' },
  pwaVersion: { type: Number, default: 1 }, // Version for cache busting
});

export default mongoose.model('BusinessSettings', BusinessSettingsSchema);
```

### Step 2: Create Icon Upload API

```typescript
// app/api/admin/upload-pwa-icons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const formData = await request.formData();
    const icon192 = formData.get('icon192') as File;
    const icon512 = formData.get('icon512') as File;
    const icon192Maskable = formData.get('icon192Maskable') as File;
    const icon512Maskable = formData.get('icon512Maskable') as File;

    const uploadDir = path.join(process.cwd(), 'public', 'pwa-icons');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }

    const uploadedFiles: Record<string, string> = {};

    // Upload each icon
    if (icon192) {
      const buffer = await icon192.arrayBuffer();
      const filename = `icon-192-${Date.now()}.png`;
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));
      uploadedFiles.icon192 = `/pwa-icons/${filename}`;
    }

    if (icon512) {
      const buffer = await icon512.arrayBuffer();
      const filename = `icon-512-${Date.now()}.png`;
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));
      uploadedFiles.icon512 = `/pwa-icons/${filename}`;
    }

    if (icon192Maskable) {
      const buffer = await icon192Maskable.arrayBuffer();
      const filename = `icon-192-maskable-${Date.now()}.png`;
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));
      uploadedFiles.icon192Maskable = `/pwa-icons/${filename}`;
    }

    if (icon512Maskable) {
      const buffer = await icon512Maskable.arrayBuffer();
      const filename = `icon-512-maskable-${Date.now()}.png`;
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(buffer));
      uploadedFiles.icon512Maskable = `/pwa-icons/${filename}`;
    }

    // Update BusinessSettings with new icon URLs and increment version
    const settings = await BusinessSettings.findOne() || new BusinessSettings();
    
    if (uploadedFiles.icon192) settings.pwaIcon192 = uploadedFiles.icon192;
    if (uploadedFiles.icon512) settings.pwaIcon512 = uploadedFiles.icon512;
    if (uploadedFiles.icon192Maskable) settings.pwaIcon192Maskable = uploadedFiles.icon192Maskable;
    if (uploadedFiles.icon512Maskable) settings.pwaIcon512Maskable = uploadedFiles.icon512Maskable;
    
    // Increment version to force cache update
    settings.pwaVersion = (settings.pwaVersion || 1) + 1;
    
    await settings.save();

    console.log('[Admin] PWA icons updated, new version:', settings.pwaVersion);

    return NextResponse.json({
      success: true,
      message: 'PWA icons updated successfully',
      version: settings.pwaVersion,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('PWA icon upload error:', error);
    return NextResponse.json({ error: 'Failed to upload icons' }, { status: 500 });
  }
}
```

### Step 3: Update Manifest Generation API

```typescript
// app/api/manifest.json/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  try {
    await dbConnect();
    
    const settings = await BusinessSettings.findOne();
    const version = settings?.pwaVersion || 1;
    
    // Use uploaded icons or fallback to defaults
    const icon192 = settings?.pwaIcon192 || '/icon-192.png';
    const icon512 = settings?.pwaIcon512 || '/icon-512.png';
    const icon192Maskable = settings?.pwaIcon192Maskable || '/icon-192-maskable.png';
    const icon512Maskable = settings?.pwaIcon512Maskable || '/icon-512-maskable.png';
    const themeColor = settings?.pwaThemeColor || '#1e3a8a';
    const backgroundColor = settings?.pwaBackgroundColor || '#0f172a';
    const appName = settings?.websiteName || 'PC Studio';

    const manifest = {
      name: appName,
      short_name: 'PC Studio',
      description: settings?.websiteSubtitle || 'Premium refurbished computers',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: themeColor,
      background_color: backgroundColor,
      categories: ['shopping', 'business'],
      version: version.toString(), // Cache busting
      icons: [
        {
          src: icon192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icon192Maskable,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: icon512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icon512Maskable,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Shop Products',
          short_name: 'Shop',
          description: 'Browse our refurbished computers',
          url: '/',
          icons: [
            {
              src: icon192,
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        },
        {
          name: 'My Orders',
          short_name: 'Orders',
          description: 'Track your orders',
          url: '/orders',
          icons: [
            {
              src: icon192,
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Manifest generation error:', error);
    // Fallback to default manifest
    return NextResponse.json({
      name: 'PC Studio',
      short_name: 'PC',
      start_url: '/',
      display: 'standalone',
      theme_color: '#1e3a8a',
      background_color: '#0f172a',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });
  }
}
```

### Step 4: Update manifest.json Link

In `app/layout.tsx`, change:
```typescript
// OLD:
<link rel="manifest" href="/manifest.json" />

// NEW:
<link rel="manifest" href="/api/manifest.json" />
```

### Step 5: Create Admin Upload Component

```typescript
// components/admin/PWAIconUploader.tsx

'use client';

import { useState } from 'react';

export default function PWAIconUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({
    icon192: null,
    icon512: null,
    icon192Maskable: null,
    icon512Maskable: null,
  });

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      if (files.icon192) formData.append('icon192', files.icon192);
      if (files.icon512) formData.append('icon512', files.icon512);
      if (files.icon192Maskable) formData.append('icon192Maskable', files.icon192Maskable);
      if (files.icon512Maskable) formData.append('icon512Maskable', files.icon512Maskable);

      const res = await fetch('/api/admin/upload-pwa-icons', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage(`✅ Icons updated successfully! Version: ${data.version}`);
      setFiles({
        icon192: null,
        icon512: null,
        icon192Maskable: null,
        icon512Maskable: null,
      });

      // Notify service worker of update
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      }

    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Update PWA Icons</h2>

      <form onSubmit={handleUpload} className="space-y-4">
        {Object.entries(files).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-semibold mb-2">
              {key === 'icon192' && '192x192 Standard Icon'}
              {key === 'icon192Maskable' && '192x192 Maskable Icon'}
              {key === 'icon512' && '512x512 Standard Icon'}
              {key === 'icon512Maskable' && '512x512 Maskable Icon'}
            </label>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
            />
            {value && <p className="text-sm text-green-600 mt-1">✓ Selected: {value.name}</p>}
          </div>
        ))}

        {message && (
          <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Update Icons'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Generate maskable icons using{' '}
          <a href="https://maskable.app/" target="_blank" rel="noopener noreferrer" className="underline">
            maskable.app
          </a>
        </p>
      </div>
    </div>
  );
}
```

## 🔄 How Users See Updates

1. **Admin uploads new icons**
2. **manifest.json version increments**
3. **Service worker detects change**
4. **Users see "Update available" notification**
5. **Click "Update" → app refreshes with new icons**

## 🚀 Integration Checklist

- [ ] Update BusinessSettings model with PWA fields
- [ ] Create `/api/admin/upload-pwa-icons` endpoint
- [ ] Create `/api/manifest.json` dynamic endpoint
- [ ] Add PWAIconUploader component to admin panel
- [ ] Update manifest link in layout.tsx
- [ ] Test icon upload
- [ ] Test cache busting (version incrementing)
- [ ] Test on mobile devices
- [ ] Deploy to Vercel

## 📱 Testing Updates

```bash
# Local testing
npm run dev

# 1. Upload new icons via admin panel
# 2. Check manifest.json version increased
# 3. Open DevTools > Network
# 4. Force refresh (Cmd+Shift+R / Ctrl+Shift+R)
# 5. See new manifest version
# 6. New icons load on refresh
```

## 🎯 Result

Users can now:
- ✅ See updated icons after app refresh
- ✅ Update happens automatically through service worker
- ✅ Smooth transition from old to new branding
- ✅ Works on all devices

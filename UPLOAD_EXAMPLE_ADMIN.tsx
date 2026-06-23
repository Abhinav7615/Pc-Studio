/**
 * EXAMPLE 1: Admin Product Media Upload
 * 
 * Location: app/admin/media/upload/page.tsx
 * 
 * This example shows how to integrate the DragDropUploader component
 * in an admin page for uploading product images and videos.
 */

'use client';

import React, { useState } from 'react';
import { DragDropUploader, UploadProgressData } from '@/components/Upload';

export default function AdminMediaUploadPage() {
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  /**
   * Handle upload completion
   */
  const handleUploadComplete = (results: UploadProgressData[]) => {
    const successful = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    // Create summary message
    const message = `
✅ Upload Complete

Images Uploaded: ${successful}
Failed Uploads: ${failed}

${successful > 0 ? 'Files are now available in your media library.' : 'Please try uploading again.'}
    `.trim();

    setUploadMessage(message);

    // Auto-clear after 5 seconds
    setTimeout(() => setUploadMessage(''), 5000);
  };

  /**
   * Handle upload errors
   */
  const handleUploadError = (error: string) => {
    setUploadError(error);
    console.error('Upload error:', error);

    // Auto-clear after 5 seconds
    setTimeout(() => setUploadError(''), 5000);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Upload Product Media
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '0' }}>
            Upload images and videos for your product listings. Drag files here or click to browse.
          </p>
        </div>

        {/* Error Message */}
        {uploadError && (
          <div
            style={{
              padding: '16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '500',
            }}
            role="alert"
          >
            {uploadError}
          </div>
        )}

        {/* Success Message */}
        {uploadMessage && (
          <div
            style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#15803d',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'pre-wrap',
            }}
            role="status"
          >
            {uploadMessage}
          </div>
        )}

        {/* Upload Component */}
        <DragDropUploader
          endpoint="/api/upload"
          allowedFileTypes={['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov', '.avi']}
          maxFileSize={100} // 100MB
          maxTotalFiles={20}
          sequential={false} // Upload in parallel (up to 3 concurrent)
          acceptedFormats="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/avi"
          uploadLabel="📁 Drag & Drop Product Media Here"
          supportedTypesText="Supported: JPG, PNG, WEBP (Images) • MP4, WEBM, MOV, AVI (Videos)"
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
        />

        {/* Info Section */}
        <div
          style={{
            marginTop: '32px',
            padding: '20px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            color: '#0369a1',
          }}
        >
          <h3 style={{ marginTop: '0', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
            📋 Upload Guidelines
          </h3>
          <ul style={{ marginBottom: '0', paddingLeft: '20px' }}>
            <li>Maximum file size: 100MB per file</li>
            <li>Maximum total files: 20 per upload session</li>
            <li>Images: JPG, PNG, WEBP format</li>
            <li>Videos: MP4, WEBM, MOV, AVI format</li>
            <li>Upload quality: Higher resolution images recommended (1920x1080 or larger)</li>
            <li>After upload, files will be available in your media library</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 3: Using useUpload Hook
 * 
 * Simplified upload with React hook
 * 
 * Usage in any component:
 * const { uploadFile, progress, error, cancel } = useUpload('/api/upload');
 */

'use client';

import React from 'react';
import useUpload from '@/hooks/useUpload';
import UploadProgress from '@/components/Upload/UploadProgress';

export default function SimpleUploadExample() {
  const { uploadFile, progress, error, isUploading, cancel, reset } = useUpload(
    '/api/upload',
    {
      maxFileSize: 50,
      allowedTypes: ['.jpg', '.png', '.jpeg'],
      onSuccess: (result) => {
        console.log('Upload successful:', result);
        // Handle success
      },
      onError: (error) => {
        console.error('Upload error:', error);
        // Handle error
      },
    }
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0], {
        // Additional data to send with upload
        category: 'profile',
      });
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
      <h2>Simple Upload</h2>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Upload Input */}
      {!progress || (progress.status !== 'uploading' && progress.status !== 'processing') ? (
        <div>
          <label
            style={{
              display: 'block',
              padding: '16px',
              border: '2px dashed #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = '#3b82f6';
              (e.currentTarget as HTMLLabelElement).style.background = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = '#e5e7eb';
              (e.currentTarget as HTMLLabelElement).style.background = 'transparent';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              Click to upload image
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              JPG, PNG up to 50MB
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      ) : null}

      {/* Progress Display */}
      {progress && (
        <div style={{ marginTop: '24px' }}>
          <UploadProgress
            percentage={progress.percentage}
            status={progress.status}
            uploadSpeed={progress.uploadSpeed}
            estimatedTimeRemaining={progress.estimatedTimeRemaining}
            error={progress.error}
          />

          {/* Action Buttons */}
          {progress.status === 'uploading' && (
            <button
              onClick={cancel}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancel Upload
            </button>
          )}

          {(progress.status === 'completed' || progress.status === 'failed') && (
            <button
              onClick={reset}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Upload Another
            </button>
          )}
        </div>
      )}
    </div>
  );
}

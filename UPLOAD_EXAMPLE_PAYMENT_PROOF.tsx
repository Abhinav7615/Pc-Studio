/**
 * EXAMPLE 2: Customer Payment Screenshot Upload
 * 
 * Location: app/payment-return/page.tsx or app/api/payment-proof/upload/page.tsx
 * 
 * This example shows how to integrate a simple single-file uploader
 * for customers to upload payment proof/screenshots.
 */

'use client';

import React, { useState, useRef } from 'react';
import axios, { CancelToken } from 'axios';
import UploadService, { UploadProgressData } from '@/components/Upload/UploadService';
import styles from '@/components/Upload/UploadStyles.module.css';

interface PaymentProofUploadProps {
  orderId: string;
  transactionId: string;
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Payment Proof Upload Component
 * Simplified single-file uploader for payment screenshots
 */
export const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({
  orderId,
  transactionId,
  onUploadSuccess,
  onUploadError,
}) => {
  const [progress, setProgress] = useState<UploadProgressData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelTokenRef = useRef<CancelToken>();

  /**
   * Handle file selection
   */
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file
    const typeValidation = UploadService.validateFileType(file, ['.jpg', '.jpeg', '.png']);
    if (!typeValidation.valid) {
      onUploadError?.(typeValidation.error || 'Invalid file type');
      return;
    }

    const sizeValidation = UploadService.validateFileSize(file, 10); // 10MB limit
    if (!sizeValidation.valid) {
      onUploadError?.(sizeValidation.error || 'File too large');
      return;
    }

    // Create preview
    const preview = UploadService.getFilePreview(file);
    setPreviewUrl(preview || null);
    setSelectedFile(file);

    // Reset progress
    setProgress(null);
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Start upload
   */
  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const uploadService = new UploadService();
    const cancelTokenSource = axios.CancelToken.source();
    cancelTokenRef.current = cancelTokenSource.token;

    try {
      const result = await uploadService.uploadFile(
        selectedFile,
        '/api/payment-proof/upload',
        (progressData) => {
          setProgress(progressData);
        },
        cancelTokenSource.token,
        {
          orderId,
          transactionId,
        }
      );

      setProgress(result);
      onUploadSuccess?.(result.response);
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      } as UploadProgressData));
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Cancel upload
   */
  const handleCancel = () => {
    if (cancelTokenRef.current) {
      new UploadService().cancelUpload('payment-proof', { cancel: () => {} });
    }
    setProgress(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Upload Payment Proof
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>
          Upload a screenshot of your payment confirmation to complete the order.
        </p>
      </div>

      {/* Preview or Upload Zone */}
      {!previewUrl ? (
        <div
          className={styles.dragDropZone}
          onClick={() => fileInputRef.current?.click()}
          style={{
            cursor: 'pointer',
            marginBottom: '16px',
            padding: '32px 16px',
          }}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>
              Drag Image Here
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
              or Click to Browse
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0' }}>
              JPG, PNG (Max 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {/* Preview Image */}
          <img
            src={previewUrl}
            alt="Payment proof preview"
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* File Info */}
          <div style={{ padding: '12px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
              📄 {selectedFile?.name}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
              📊 {UploadService.formatBytes(selectedFile?.size || 0)}
            </p>
          </div>

          {/* Change Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f3f4f6',
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
            }}
          >
            🔄 Change Image
          </button>
        </div>
      )}

      {/* Progress Display */}
      {progress && progress.status !== 'waiting' && (
        <div style={{ marginBottom: '16px' }}>
          {/* Progress Bar */}
          <div
            style={{
              height: '6px',
              background: '#e5e7eb',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress.percentage}%`,
                background:
                  progress.status === 'completed'
                    ? '#10b981'
                    : progress.status === 'failed'
                      ? '#ef4444'
                      : '#3b82f6',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Status Text */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ fontWeight: '600', color: '#111827' }}>
              {progress.status === 'uploading'
                ? '⬆️ Uploading'
                : progress.status === 'processing'
                  ? '⚙️ Processing'
                  : progress.status === 'completed'
                    ? '✓ Uploaded'
                    : '❌ Failed'}
            </span>
            <span style={{ color: '#6b7280' }}>{progress.percentage}%</span>
          </div>

          {/* Speed and Time */}
          {progress.status === 'uploading' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              <span>{UploadService.formatSpeed(progress.uploadSpeed)}</span>
              <span>~{UploadService.formatTime(progress.estimatedTimeRemaining)} remaining</span>
            </div>
          )}

          {/* Size Info */}
          {progress.status === 'uploading' && (
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {UploadService.formatBytes(progress.loaded)} / {UploadService.formatBytes(progress.total)}
            </div>
          )}

          {/* Error Message */}
          {progress.status === 'failed' && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#b91c1c',
              }}
            >
              {progress.error}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {!progress || progress.status === 'waiting' ? (
          <>
            <button
              onClick={handleStartUpload}
              disabled={!selectedFile || isUploading}
              style={{
                flex: 1,
                padding: '12px',
                background: selectedFile ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: selectedFile ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedFile) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFile) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#3b82f6';
                }
              }}
            >
              {isUploading ? '⬆️ Uploading...' : '⬆️ Upload Payment Proof'}
            </button>
            <button
              onClick={handleCancel}
              disabled={!selectedFile}
              style={{
                padding: '12px 20px',
                background: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: selectedFile ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedFile) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFile) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                }
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleCancel}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f3f4f6',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Success State */}
      {progress?.status === 'completed' && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#15803d',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          ✅ Payment Screenshot Uploaded Successfully
        </div>
      )}
    </div>
  );
};

export default PaymentProofUpload;

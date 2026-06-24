'use client';

import React, { useCallback, useRef, useState } from 'react';
import axios, { type CancelTokenSource } from 'axios';
import UploadService, { UploadProgressData } from './UploadService';
import UploadProgress from './UploadProgress';
import styles from './UploadStyles.module.css';

interface PaymentProofUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  acceptedFormats?: string;
  maxFileSizeMB?: number;
}

const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  acceptedFormats = 'image/jpeg,image/png,image/webp',
  maxFileSizeMB = 10,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgressData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    const typeValidation = UploadService.validateFileType(file, ['.jpg', '.jpeg', '.png', '.webp']);
    if (!typeValidation.valid) {
      const message = typeValidation.error || 'Invalid file type';
      setError(message);
      onUploadError?.(message);
      return;
    }

    const sizeValidation = UploadService.validateFileSize(file, maxFileSizeMB);
    if (!sizeValidation.valid) {
      const message = sizeValidation.error || 'File too large';
      setError(message);
      onUploadError?.(message);
      return;
    }

    const preview = UploadService.getFilePreview(file);
    setSelectedFile(file);
    setPreviewUrl(preview || null);
    setProgress(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    []
  );

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setProgress(null);

    const uploadService = new UploadService();
    const cancelTokenSource = axios.CancelToken.source();
    cancelTokenRef.current = cancelTokenSource;

    try {
      const result = await uploadService.uploadFile(
        selectedFile,
        '/api/upload',
        (progressData) => {
          setProgress(progressData);
        },
        cancelTokenSource.token,
        {
          purpose: 'payment_screenshot',
        }
      );

      if (result.response?.url) {
        onUploadSuccess(result.response.url);
      } else {
        const message = 'Upload completed but couldn\'t read the file URL.';
        setError(message);
        onUploadError?.(message);
      }
    } catch (err: any) {
      const message = err?.message || 'Payment screenshot upload failed';
      setError(message);
      onUploadError?.(message);
      setProgress((prev) =>
        ({
          ...prev,
          status: 'failed',
          error: message,
          percentage: prev?.percentage || 0,
        } as UploadProgressData)
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Upload cancelled by user');
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(null);
    setError('');
    setSuccessMessage('');
  };

  const browseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`${styles.dragDropZone} ${isDragging ? styles.dragging : ''}`}
        onClick={browseFile}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            browseFile();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleInputChange}
          className="sr-only"
        />
        <div className={styles.dragDropContent}>
          <div className={styles.dragDropIcon}>📷</div>
          <h3 className={styles.dragDropTitle}>Upload Payment Screenshot</h3>
          <p className={styles.dragDropSubtitle}>Click to browse or drag the image here</p>
          <p className={styles.supportedTypes}>JPG, PNG, WEBP • Max {maxFileSizeMB}MB</p>
        </div>
      </div>

      {previewUrl && selectedFile && (
        <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <img src={previewUrl} alt="Payment proof preview" className="w-full h-52 object-cover" />
          <div className="p-4">
            <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{UploadService.formatBytes(selectedFile.size)}</p>
          </div>
        </div>
      )}

      {progress && (
        <UploadProgress
          percentage={progress.percentage}
          status={progress.status}
          loaded={progress.loaded}
          total={progress.total}
          uploadSpeed={progress.uploadSpeed}
          estimatedTimeRemaining={progress.estimatedTimeRemaining}
          error={progress.error}
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          ❌ {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleStartUpload}
          disabled={!selectedFile || isUploading || progress?.status === 'completed'}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isUploading ? 'Uploading...' : progress?.status === 'completed' ? 'Uploaded' : 'Upload Screenshot'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!selectedFile && !progress}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      {progress?.status === 'completed' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          Payment Screenshot Uploaded Successfully
        </div>
      )}
    </div>
  );
};

export default PaymentProofUpload;

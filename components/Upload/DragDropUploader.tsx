'use client';

import React, { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import FilePreviewCard from './FilePreviewCard';
import UploadService, { UploadFile, UploadProgressData, UploadStatus } from './UploadService';
import styles from './UploadStyles.module.css';

interface DragDropUploaderProps {
  endpoint: string;
  allowedFileTypes: string[];
  maxFileSize?: number; // in MB
  maxTotalFiles?: number;
  onUploadComplete?: (results: UploadProgressData[]) => void;
  onError?: (error: string) => void;
  sequential?: boolean; // if true, upload files one by one
  acceptedFormats?: string; // e.g. "image/jpeg,image/png,video/mp4"
  uploadLabel?: string;
  supportedTypesText?: string;
}

/**
 * DragDropUploader Component - Professional drag-drop upload interface
 *
 * Features:
 * - Drag and drop support with visual feedback
 * - Click to browse files
 * - Multiple file selection
 * - File preview cards with progress tracking
 * - Real-time upload progress
 * - Error handling and retry
 * - Queue management
 * - Mobile responsive
 * - Accessibility features
 */
const DragDropUploader: React.FC<DragDropUploaderProps> = ({
  endpoint,
  allowedFileTypes,
  maxFileSize = 100,
  maxTotalFiles = 20,
  onUploadComplete,
  onError,
  sequential = false,
  acceptedFormats = 'image/*,video/*',
  uploadLabel = 'Drag & Drop Files Here',
  supportedTypesText = 'Supported: JPG, PNG, WEBP, MP4, WEBM',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelTokenSourcesRef = useRef<Map<string, any>>(new Map());

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        const typeValidation = UploadService.validateFileType(file, allowedFileTypes);
        if (!typeValidation.valid) {
          errors.push(`${file.name}: ${typeValidation.error}`);
          continue;
        }

        // Check file size
        const sizeValidation = UploadService.validateFileSize(file, maxFileSize);
        if (!sizeValidation.valid) {
          errors.push(`${file.name}: ${sizeValidation.error}`);
          continue;
        }

        validFiles.push(file);
      }

      // Check total file count
      const totalFiles = uploadedFiles.length + validFiles.length;
      if (totalFiles > maxTotalFiles) {
        errors.push(
          `Maximum ${maxTotalFiles} files allowed. You can add ${maxTotalFiles - uploadedFiles.length} more.`
        );
        validFiles.splice(maxTotalFiles - uploadedFiles.length);
      }

      // Show errors
      if (errors.length > 0) {
        onError?.(errors.join('\n'));
      }

      // Create upload file objects
      const newFiles: UploadFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: UploadService.getFilePreview(file) || undefined,
        progress: {
          fileId: '',
          fileName: file.name,
          fileSize: file.size,
          loaded: 0,
          total: file.size,
          percentage: 0,
          uploadSpeed: 0,
          estimatedTimeRemaining: 0,
          status: 'waiting',
        },
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Auto-start uploads if not already uploading
      if (!isUploading && newFiles.length > 0) {
        startUpload(newFiles);
      }
    },
    [uploadedFiles.length, maxTotalFiles, allowedFileTypes, maxFileSize, isUploading, onError]
  );

  /**
   * Start uploading files
   */
  const startUpload = useCallback(
    async (filesToUpload: UploadFile[]) => {
      setIsUploading(true);

      const uploadService = new UploadService();
      const results: UploadProgressData[] = [];

      setUploadStats({
        total: filesToUpload.length,
        uploading: filesToUpload.length,
        completed: 0,
        failed: 0,
      });

      if (sequential) {
        // Upload files one by one
        for (const uploadFile of filesToUpload) {
          try {
            const cancelTokenSource = axios.CancelToken.source();
            cancelTokenSourcesRef.current.set(uploadFile.id, cancelTokenSource);

            const result = await uploadService.uploadFile(
              uploadFile.file,
              endpoint,
              (progress) => {
                setUploadedFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadFile.id
                      ? {
                          ...f,
                          progress: {
                            ...progress,
                            fileId: uploadFile.id,
                          },
                        }
                      : f
                  )
                );
              },
              cancelTokenSource.token
            );

            results.push(result);

            setUploadStats((prev) => ({
              ...prev,
              uploading: prev.uploading - 1,
              completed:
                result.status === 'completed' ? prev.completed + 1 : prev.completed,
              failed: result.status === 'failed' ? prev.failed + 1 : prev.failed,
            }));
          } catch (error) {
            setUploadStats((prev) => ({
              ...prev,
              uploading: prev.uploading - 1,
              failed: prev.failed + 1,
            }));
          }
        }
      } else {
        // Upload files in parallel (with a reasonable limit)
        const maxConcurrent = 3;
        const uploadPromises = filesToUpload.map(async (uploadFile, index) => {
          try {
            // Rate limiting
            await new Promise((resolve) =>
              setTimeout(resolve, (index % maxConcurrent) * 100)
            );

            const cancelTokenSource = axios.CancelToken.source();
            cancelTokenSourcesRef.current.set(uploadFile.id, cancelTokenSource);

            const result = await uploadService.uploadFile(
              uploadFile.file,
              endpoint,
              (progress) => {
                setUploadedFiles((prev) =>
                  prev.map((f) =>
                    f.id === uploadFile.id
                      ? {
                          ...f,
                          progress: {
                            ...progress,
                            fileId: uploadFile.id,
                          },
                        }
                      : f
                  )
                );
              },
              cancelTokenSource.token
            );

            return result;
          } catch (error) {
            return {
              fileId: uploadFile.id,
              fileName: uploadFile.file.name,
              fileSize: uploadFile.file.size,
              loaded: 0,
              total: uploadFile.file.size,
              percentage: 0,
              uploadSpeed: 0,
              estimatedTimeRemaining: 0,
              status: 'failed' as UploadStatus,
              error: error instanceof Error ? error.message : 'Upload failed',
            };
          }
        });

        const allResults = await Promise.all(uploadPromises);
        results.push(...allResults);

        const completed = allResults.filter((r) => r.status === 'completed').length;
        const failed = allResults.filter((r) => r.status === 'failed').length;

        setUploadStats({
          total: filesToUpload.length,
          uploading: 0,
          completed,
          failed,
        });
      }

      setIsUploading(false);
      onUploadComplete?.(results);
    },
    [endpoint, sequential, onUploadComplete]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  /**
   * Handle browse button click
   */
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  /**
   * Remove file from queue
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    const cancelToken = cancelTokenSourcesRef.current.get(fileId);
    if (cancelToken) {
      new UploadService().cancelUpload(fileId, cancelToken);
      cancelTokenSourcesRef.current.delete(fileId);
    }

    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  /**
   * Retry failed upload
   */
  const handleRetryFile = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (file) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  progress: {
                    ...f.progress,
                    status: 'waiting' as UploadStatus,
                    error: undefined,
                  },
                }
              : f
          )
        );

        startUpload([file]);
      }
    },
    [uploadedFiles, startUpload]
  );

  return (
    <div className={styles.uploaderContainer}>
      {/* Upload Zone */}
      <div
        className={`${styles.dragDropZone} ${isDragging ? styles.dragging : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onClick={handleBrowseClick}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleBrowseClick();
          }
        }}
        aria-label="Upload zone - click to browse or drag files"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        <div className={styles.dragDropContent}>
          <div className={styles.dragDropIcon}>📁</div>
          <h3 className={styles.dragDropTitle}>{uploadLabel}</h3>
          <p className={styles.dragDropSubtitle}>or Click to Browse</p>
          <p className={styles.supportedTypes}>{supportedTypesText}</p>
        </div>
      </div>

      {/* Upload Stats */}
      {uploadStats.total > 0 && (
        <div className={styles.uploadStats} role="status" aria-live="polite">
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Files:</span>
            <span className={styles.statValue}>{uploadStats.total}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Uploading:</span>
            <span className={`${styles.statValue} ${styles.uploading}`}>
              {uploadStats.uploading}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Completed:</span>
            <span className={`${styles.statValue} ${styles.completed}`}>
              {uploadStats.completed}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Failed:</span>
            <span className={`${styles.statValue} ${styles.failed}`}>
              {uploadStats.failed}
            </span>
          </div>
        </div>
      )}

      {/* File Preview Cards */}
      {uploadedFiles.length > 0 && (
        <div className={styles.fileCardsGrid}>
          {uploadedFiles.map((uploadFile) => (
            <FilePreviewCard
              key={uploadFile.id}
              file={uploadFile.file}
              fileId={uploadFile.id}
              preview={uploadFile.preview}
              progress={uploadFile.progress}
              onRemove={() => handleRemoveFile(uploadFile.id)}
              onRetry={() => handleRetryFile(uploadFile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropUploader;

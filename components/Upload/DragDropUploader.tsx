'use client';

import React, { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import FilePreviewCard from './FilePreviewCard';
import UploadService, { UploadFile, UploadProgressData, UploadStatus } from './UploadService';
import { formatSeconds, getVideoDuration, trimVideoSegment } from './VideoTrimUtils';
import styles from './UploadStyles.module.css';

interface TrimDialogState {
  file: File;
  duration: number;
  startTime: number;
  maxStart: number;
  previewUrl: string;
  resolve: (file: File) => void;
  reject: (error: string) => void;
}

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
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimDialog, setTrimDialog] = useState<TrimDialogState | null>(null);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelTokenSourcesRef = useRef<Map<string, any>>(new Map());

  /**
   * Start uploading files
   */
  const startUpload = useCallback(
    async (filesToUpload: UploadFile[]) => {
      setIsUploading(true);
      setUploadedFiles((prev) => [...prev, ...filesToUpload]);

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
   * Build upload-ready files from FileList
   */
  const buildUploadFiles = useCallback(
    (files: FileList | null): File[] => {
      if (!files || files.length === 0) return [];
      return Array.from(files).slice(0, maxTotalFiles);
    },
    [maxTotalFiles]
  );

  const openTrimDialog = useCallback(
    (file: File, duration: number): Promise<File> => {
      return new Promise<File>((resolve, reject) => {
        const previewUrl = URL.createObjectURL(file);
        setTrimDialog({
          file,
          duration,
          startTime: 0,
          maxStart: Math.max(0, duration - 60),
          previewUrl,
          resolve,
          reject,
        });
      });
    },
    []
  );

  const closeTrimDialog = useCallback(() => {
    setTrimDialog((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev.previewUrl);
        prev.reject('Video trimming cancelled');
      }
      return null;
    });
  }, []);

  const handleTrimStartChange = useCallback((value: number) => {
    setTrimDialog((prev) =>
      prev
        ? {
            ...prev,
            startTime: Math.max(0, Math.min(value, prev.maxStart)),
          }
        : prev
    );
  }, []);

  const handleConfirmTrim = useCallback(async () => {
    if (!trimDialog) return;

    setIsTrimming(true);
    const { file, startTime, previewUrl, resolve, reject } = trimDialog;

    try {
      const trimmedFile = await trimVideoSegment(file, startTime, 60);
      resolve(trimmedFile);
    } catch (error) {
      try {
        const fallbackFile = await trimVideoSegment(file, 0, 60);
        resolve(fallbackFile);
      } catch (fallbackError) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : fallbackError instanceof Error
            ? fallbackError.message
            : 'Video trimming failed';
        reject(errorMessage);
      }
    } finally {
      URL.revokeObjectURL(previewUrl);
      setTrimDialog(null);
      setIsTrimming(false);
    }
  }, [trimDialog]);

  const prepareFileForUpload = useCallback(
    async (file: File): Promise<File> => {
      if (!file.type.startsWith('video/')) {
        return file;
      }

      let duration = 0;
      try {
        duration = await getVideoDuration(file);
      } catch (error) {
        return file;
      }

      if (duration <= 60) {
        return file;
      }

      return openTrimDialog(file, duration);
    },
    [openTrimDialog]
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      const selectedFiles = buildUploadFiles(files);
      if (selectedFiles.length === 0) return;

      const filesToUpload: UploadFile[] = [];
      const uploadService = new UploadService();
      const results: UploadProgressData[] = [];
      let fileCount = 0;

      for (const file of selectedFiles) {
        const typeValidation = UploadService.validateFileType(file, allowedFileTypes);
        if (!typeValidation.valid) {
          onError?.(typeValidation.error || 'Invalid file type');
          continue;
        }

        const sizeValidation = UploadService.validateFileSize(file, maxFileSize);
        if (!sizeValidation.valid) {
          onError?.(sizeValidation.error || 'File too large');
          continue;
        }

        try {
          const preparedFile = await prepareFileForUpload(file);
          const preview = UploadService.getFilePreview(preparedFile);
          const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const fileCategory = preparedFile.type.startsWith('image/')
            ? 'image'
            : preparedFile.type.startsWith('video/')
            ? 'video'
            : preparedFile.type.startsWith('audio/')
            ? 'audio'
            : 'unknown';

          filesToUpload.push({
            id: fileId,
            file: preparedFile,
            preview: preview || undefined,
            progress: {
              fileId,
              fileName: preparedFile.name,
              fileSize: preparedFile.size,
              loaded: 0,
              total: preparedFile.size,
              percentage: 0,
              uploadSpeed: 0,
              estimatedTimeRemaining: 0,
              status: 'waiting',
              fileType: preparedFile.type,
              fileCategory,
            },
          });
          fileCount += 1;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error || 'Failed to prepare video for upload');
          onError?.(message);
        }
      }

      if (filesToUpload.length === 0) return;

      setUploadedFiles((prev) => [...prev, ...filesToUpload]);
      setIsUploading(true);
      setUploadStats({
        total: filesToUpload.length,
        uploading: filesToUpload.length,
        completed: 0,
        failed: 0,
      });

      if (sequential) {
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
        const maxConcurrent = 3;
        const uploadPromises = filesToUpload.map(async (uploadFile, index) => {
          try {
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
    [allowedFileTypes, endpoint, maxFileSize, maxTotalFiles, onError, onUploadComplete, prepareFileForUpload, sequential]
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

    const removed = uploadedFiles.find((f) => f.id === fileId);
    if (removed) {
      const responseUrl = removed.progress?.response?.url;
      if (removed.progress?.status === 'completed' && responseUrl) {
        // Best-effort delete on server
        UploadService.deleteFileByUrl(responseUrl).catch(() => {});
      }
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

      {trimDialog && (
        <div className={styles.trimModal} role="dialog" aria-modal="true" aria-label="Video trimming dialog">
          <div className={styles.trimModalOverlay} onClick={closeTrimDialog} />
          <div className={styles.trimModalPanel}>
            <div className={styles.trimHeader}>
              <h2 className={styles.trimTitle}>Select a 60-second video segment</h2>
              <button
                type="button"
                className={styles.trimCloseButton}
                onClick={closeTrimDialog}
                aria-label="Close trimming dialog"
              >
                ×
              </button>
            </div>
            <div className={styles.trimContent}>
              <video
                src={trimDialog.previewUrl}
                className={styles.trimPreview}
                controls
                preload="metadata"
              />
              <div className={styles.trimControls}>
                <label htmlFor="trim-start-range" className={styles.trimLabel}>
                  Start at: <strong>{formatSeconds(trimDialog.startTime)}</strong>
                </label>
                <input
                  id="trim-start-range"
                  type="range"
                  min={0}
                  max={trimDialog.maxStart}
                  step={1}
                  value={trimDialog.startTime}
                  onChange={(event) => handleTrimStartChange(Number(event.target.value))}
                  className={styles.trimSlider}
                />
                <div className={styles.trimSegmentInfo}>
                  <span>{formatSeconds(trimDialog.startTime)}</span>
                  <span>{formatSeconds(trimDialog.startTime + 60)}</span>
                </div>
                <p className={styles.trimHelp}>
                  Choose any 60-second segment from your video. Only the selected segment will be uploaded.
                </p>
                <div className={styles.trimActions}>
                  <button
                    type="button"
                    className={styles.trimCancelButton}
                    onClick={closeTrimDialog}
                    disabled={isTrimming}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.trimConfirmButton}
                    onClick={handleConfirmTrim}
                    disabled={isTrimming}
                  >
                    {isTrimming ? 'Trimming…' : 'Upload segment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

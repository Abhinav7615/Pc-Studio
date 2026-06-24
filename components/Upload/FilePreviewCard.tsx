'use client';

import React, { useEffect, useState } from 'react';
import UploadProgress from './UploadProgress';
import UploadService, { UploadProgressData, UploadStatus } from './UploadService';
import styles from './UploadStyles.module.css';

interface FilePreviewCardProps {
  file: File;
  fileId: string;
  preview?: string;
  progress?: UploadProgressData;
  onRemove?: () => void;
  onRetry?: () => void;
  isRemoving?: boolean;
}

/**
 * FilePreviewCard Component - Displays individual file preview and upload progress
 *
 * Features:
 * - File preview (image/video thumbnail)
 * - File name and size
 * - Upload progress with real-time updates
 * - Status display (waiting, uploading, processing, completed, failed)
 * - Remove and retry buttons
 * - Responsive design
 * - Smooth animations
 */
const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  file,
  fileId,
  preview,
  progress,
  onRemove,
  onRetry,
  isRemoving = false,
}) => {
  const [displayPreview, setDisplayPreview] = useState<string | null>(preview || null);

  useEffect(() => {
    // If no preview was provided, try to generate one
    if (!displayPreview && !preview) {
      const generatedPreview = UploadService.getFilePreview(file);
      if (generatedPreview) {
        setDisplayPreview(generatedPreview);
      }
    }

    return () => {
      // Cleanup preview URL
      if (displayPreview && displayPreview.startsWith('blob:')) {
        UploadService.revokeFilePreview(displayPreview);
      }
    };
  }, [file, displayPreview, preview]);

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const fileSize = UploadService.formatBytes(file.size);
  const status = progress?.status || 'waiting';
  const percentage = progress?.percentage || 0;

  return (
    <div
      className={`${styles.fileCard} ${styles[`status-${status}`]} ${
        isRemoving ? styles.removing : ''
      }`}
      role="article"
      aria-label={`File: ${file.name}`}
    >
      {/* Preview Container */}
      <div className={styles.previewContainer}>
        {displayPreview && isImage ? (
          <img src={displayPreview} alt={file.name} className={styles.preview} />
        ) : displayPreview && isVideo ? (
          <video src={displayPreview} className={styles.preview} />
        ) : (
          <div className={styles.previewPlaceholder}>
            <span className={styles.fileIcon}>📄</span>
          </div>
        )}

        {/* Status Badge */}
        <div className={`${styles.statusBadge} ${styles[`badge-${status}`]}`}>
          {status === 'waiting' && <span>⏳</span>}
          {status === 'uploading' && <span className={styles.spinnerBadge} />}
          {status === 'processing' && <span>⚙️</span>}
          {status === 'completed' && <span>✓</span>}
          {status === 'failed' && <span>✕</span>}
        </div>

        {/* Overlay on Hover */}
        {status === 'failed' && (
          <div className={styles.cardOverlay}>
            <button
              className={styles.retryBtn}
              onClick={onRetry}
              aria-label="Retry upload"
              title="Retry upload"
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className={styles.fileInfo}>
        <div className={styles.fileName} title={file.name}>
          {file.name}
        </div>
        <div className={styles.fileSize}>{fileSize}</div>
      </div>

      {/* Progress Section */}
      {progress && (
        <div className={styles.progressSection}>
          <UploadProgress
            percentage={percentage}
            status={status}
            loaded={progress.loaded}
            total={progress.total}
            uploadSpeed={progress.uploadSpeed}
            estimatedTimeRemaining={progress.estimatedTimeRemaining}
            error={progress.error}
          />
        </div>
      )}

      {/* Size Display During Upload */}
      {status === 'uploading' && progress && (
        <div className={styles.sizeInfo}>
          {UploadService.formatBytes(progress.loaded)} / {fileSize}
        </div>
      )}

      {/* Action Buttons */}
      {status === 'waiting' || status === 'failed' || status === 'completed' ? (
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${file.name}`}
          title="Remove file"
        >
          {isRemoving ? '⏳' : '✕'}
        </button>
      ) : null}
    </div>
  );
};

export default FilePreviewCard;

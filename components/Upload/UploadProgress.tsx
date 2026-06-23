'use client';

import React from 'react';
import UploadService from './UploadService';
import styles from './UploadStyles.module.css';

interface UploadProgressProps {
  percentage: number;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

/**
 * UploadProgress Component - Displays upload progress bar with animation
 *
 * Features:
 * - Animated progress bar
 * - Real-time percentage display
 * - Upload speed display
 * - Estimated time remaining
 * - Status-based styling
 * - Accessible ARIA labels
 */
const UploadProgress: React.FC<UploadProgressProps> = ({
  percentage,
  status,
  uploadSpeed,
  estimatedTimeRemaining,
  error,
}) => {
  const getStatusLabel = (): string => {
    switch (status) {
      case 'waiting':
        return 'Waiting...';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'waiting':
        return styles.statusWaiting;
      case 'uploading':
        return styles.statusUploading;
      case 'processing':
        return styles.statusProcessing;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      default:
        return '';
    }
  };

  return (
    <div className={`${styles.progressContainer} ${getStatusColor()}`}>
      <div className={styles.progressHeader}>
        <span className={styles.statusLabel}>{getStatusLabel()}</span>
        <span className={styles.percentageText}>{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div
        className={styles.progressBarWrapper}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${percentage}%`}
      >
        <div
          className={`${styles.progressBar} ${getStatusColor()}`}
          style={{
            width: `${percentage}%`,
            transition: status === 'uploading' ? 'width 0.3s ease' : 'none',
          }}
        >
          {/* Animated shimmer effect */}
          {status === 'uploading' && <div className={styles.shimmer} />}
        </div>
      </div>

      {/* Additional Info */}
      {status === 'uploading' && (
        <div className={styles.progressInfo}>
          {uploadSpeed !== undefined && (
            <span className={styles.infoItem}>
              {UploadService.formatSpeed(uploadSpeed)}
            </span>
          )}
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <span className={styles.infoItem}>
              ~{UploadService.formatTime(estimatedTimeRemaining)} remaining
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {status === 'failed' && error && (
        <div className={styles.errorMessage} role="alert">
          <span className={styles.errorIcon}>❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {status === 'completed' && (
        <div className={styles.successMessage} role="status">
          <span className={styles.successIcon}>✓</span>
          <span>Upload Complete</span>
        </div>
      )}

      {/* Processing Message */}
      {status === 'processing' && (
        <div className={styles.processingMessage} role="status">
          <div className={styles.spinner} />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;

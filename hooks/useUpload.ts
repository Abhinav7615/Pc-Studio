/**
 * useUpload Hook - Simplifies upload logic in components
 * 
 * Location: hooks/useUpload.ts
 * 
 * Usage:
 * const { uploadFile, progress, cancel, retry } = useUpload('/api/upload');
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import UploadService, { UploadProgressData, UploadFile } from '@/components/Upload/UploadService';

interface UseUploadOptions {
  maxFileSize?: number;
  maxTotalFiles?: number;
  allowedTypes?: string[];
  onSuccess?: (result: UploadProgressData) => void;
  onError?: (error: string) => void;
}

interface UseUploadReturn {
  uploadFile: (file: File, additionalData?: Record<string, any>) => Promise<void>;
  uploadMultiple: (files: File[], sequential?: boolean) => Promise<void>;
  progress: UploadProgressData | null;
  progressList: Map<string, UploadProgressData>;
  isUploading: boolean;
  error: string | null;
  cancel: () => void;
  retry: () => void;
  reset: () => void;
}

/**
 * Custom hook for file uploads
 */
export function useUpload(
  endpoint: string,
  options: UseUploadOptions = {}
): UseUploadReturn {
  const {
    maxFileSize = 100,
    maxTotalFiles = 20,
    allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.mp4'],
    onSuccess,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgressData | null>(null);
  const [progressList, setProgressList] = useState<Map<string, UploadProgressData>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelTokenSourceRef = useRef<CancelTokenSource | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const uploadServiceRef = useRef(new UploadService());

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Type validation
      const typeValidation = UploadService.validateFileType(file, allowedTypes);
      if (!typeValidation.valid) {
        return { valid: false, error: typeValidation.error };
      }

      // Size validation
      const sizeValidation = UploadService.validateFileSize(file, maxFileSize);
      if (!sizeValidation.valid) {
        return { valid: false, error: sizeValidation.error };
      }

      return { valid: true };
    },
    [allowedTypes, maxFileSize]
  );

  /**
   * Upload single file
   */
  const uploadFile = useCallback(
    async (file: File, additionalData?: Record<string, any>) => {
      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid file';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setIsUploading(true);
      setError(null);
      lastFileRef.current = file;

      try {
        // Create cancel token
        cancelTokenSourceRef.current = axios.CancelToken.source();

        const result = await uploadServiceRef.current.uploadFile(
          file,
          endpoint,
          (progressData) => {
            setProgress(progressData);
          },
          cancelTokenSourceRef.current.token,
          additionalData
        );

        setProgress(result);
        onSuccess?.(result);
      } catch (err: any) {
        const errorMsg = err.message || 'Upload failed';
        setError(errorMsg);
        setProgress((prev) =>
          prev ? { ...prev, status: 'failed', error: errorMsg } : null
        );
        onError?.(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, validateFile, onSuccess, onError]
  );

  /**
   * Upload multiple files
   */
  const uploadMultiple = useCallback(
    async (files: File[], sequential = false) => {
      if (files.length === 0) return;

      // Validate total count
      if (files.length > maxTotalFiles) {
        const errorMsg = `Maximum ${maxTotalFiles} files allowed`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Validate all files
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          const errorMsg = `${file.name}: ${validation.error}`;
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }
      }

      setIsUploading(true);
      setError(null);

      try {
        // Create cancel token
        cancelTokenSourceRef.current = axios.CancelToken.source();

        const results = await uploadServiceRef.current.uploadMultipleFiles(
          files,
          endpoint,
          (progressData, index) => {
            setProgress(progressData);
            setProgressList((prev) => {
              const newMap = new Map(prev);
              newMap.set(progressData.fileId, progressData);
              return newMap;
            });
          },
          (fileIndex, success) => {
            // File complete callback
          },
          {}
        );

        // Summary
        const successful = results.filter((r) => r.status === 'completed').length;
        const failed = results.filter((r) => r.status === 'failed').length;

        if (successful > 0) {
          onSuccess?.(results[results.length - 1]);
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Upload failed';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [endpoint, maxTotalFiles, validateFile, onSuccess, onError]
  );

  /**
   * Cancel upload
   */
  const cancel = useCallback(() => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Upload cancelled by user');
      cancelTokenSourceRef.current = null;
    }
    setIsUploading(false);
    if (lastFileRef.current) {
      uploadServiceRef.current.cancelUpload(
        `${Date.now()}-cancelled`,
        cancelTokenSourceRef.current
      );
    }
  }, []);

  /**
   * Retry upload
   */
  const retry = useCallback(() => {
    if (lastFileRef.current) {
      uploadFile(lastFileRef.current);
    }
  }, [uploadFile]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setProgress(null);
    setProgressList(new Map());
    setError(null);
    setIsUploading(false);
    lastFileRef.current = null;
  }, []);

  return {
    uploadFile,
    uploadMultiple,
    progress,
    progressList,
    isUploading,
    error,
    cancel,
    retry,
    reset,
  };
}

export default useUpload;

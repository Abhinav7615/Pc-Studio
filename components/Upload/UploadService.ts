import axios, { AxiosProgressEvent, CancelToken } from 'axios';

/**
 * Upload file types and status definitions
 */
export type UploadStatus = 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface UploadProgressData {
  fileId: string;
  fileName: string;
  fileSize: number;
  loaded: number;
  total: number;
  percentage: number;
  uploadSpeed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  status: UploadStatus;
  error?: string;
  response?: any;
}

export interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: UploadProgressData;
  cancelToken?: CancelToken;
}

/**
 * UploadService - Handles file uploads with progress tracking
 */
class UploadService {
  private uploadStartTime: Map<string, number> = new Map();
  private lastProgressTime: Map<string, number> = new Map();
  private lastLoadedBytes: Map<string, number> = new Map();

  /**
   * Calculate upload speed in bytes per second
   */
  private calculateUploadSpeed(
    fileId: string,
    loadedBytes: number,
    currentTime: number
  ): number {
    const lastTime = this.lastProgressTime.get(fileId) || currentTime;
    const lastLoaded = this.lastLoadedBytes.get(fileId) || 0;

    const timeDelta = (currentTime - lastTime) / 1000; // convert to seconds
    const bytesDelta = loadedBytes - lastLoaded;

    if (timeDelta === 0) return 0;

    const speed = bytesDelta / timeDelta;

    this.lastProgressTime.set(fileId, currentTime);
    this.lastLoadedBytes.set(fileId, loadedBytes);

    return speed;
  }

  /**
   * Calculate estimated time remaining in seconds
   */
  private calculateEstimatedTimeRemaining(
    uploadSpeed: number,
    remainingBytes: number
  ): number {
    if (uploadSpeed === 0) return 0;
    return remainingBytes / uploadSpeed;
  }

  /**
   * Format bytes to human-readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format upload speed to human-readable format
   */
  static formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  /**
   * Format time in seconds to human-readable format
   */
  static formatTime(seconds: number): string {
    if (seconds === 0) return '0s';
    if (seconds < 60) return Math.round(seconds) + 's';
    if (seconds < 3600) return Math.round(seconds / 60) + 'm';
    return Math.round(seconds / 3600) + 'h';
  }

  /**
   * Upload a single file with progress tracking
   */
  async uploadFile(
    file: File,
    endpoint: string,
    onProgress: (progress: UploadProgressData) => void,
    cancelToken?: CancelToken,
    additionalData?: Record<string, any>
  ): Promise<UploadProgressData> {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    // Initialize tracking
    this.uploadStartTime.set(fileId, Date.now());
    this.lastProgressTime.set(fileId, Date.now());
    this.lastLoadedBytes.set(fileId, 0);

    const initialProgress: UploadProgressData = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      loaded: 0,
      total: file.size,
      percentage: 0,
      uploadSpeed: 0,
      estimatedTimeRemaining: 0,
      status: 'uploading',
    };

    onProgress(initialProgress);

    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        cancelToken,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const currentTime = Date.now();
          const loaded = progressEvent.loaded || 0;
          const total = progressEvent.total || file.size;
          const percentage = total ? Math.round((loaded / total) * 100) : 0;

          const uploadSpeed = this.calculateUploadSpeed(fileId, loaded, currentTime);
          const remainingBytes = total - loaded;
          const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(
            uploadSpeed,
            remainingBytes
          );

          const progressData: UploadProgressData = {
            fileId,
            fileName: file.name,
            fileSize: file.size,
            loaded,
            total,
            percentage: Math.min(percentage, 99), // Cap at 99% until complete
            uploadSpeed,
            estimatedTimeRemaining,
            status: 'uploading',
          };

          onProgress(progressData);
        },
      });

      // Upload complete
      const completedProgress: UploadProgressData = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        loaded: file.size,
        total: file.size,
        percentage: 100,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0,
        status: 'completed',
        response: response.data,
      };

      onProgress(completedProgress);

      // Cleanup
      this.uploadStartTime.delete(fileId);
      this.lastProgressTime.delete(fileId);
      this.lastLoadedBytes.delete(fileId);

      return completedProgress;
    } catch (error: any) {
      // Handle errors
      const errorProgress: UploadProgressData = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        loaded: 0,
        total: file.size,
        percentage: 0,
        uploadSpeed: 0,
        estimatedTimeRemaining: 0,
        status: 'failed',
        error: error.message || 'Upload failed',
      };

      onProgress(errorProgress);

      // Cleanup
      this.uploadStartTime.delete(fileId);
      this.lastProgressTime.delete(fileId);
      this.lastLoadedBytes.delete(fileId);

      throw error;
    }
  }

  /**
   * Upload multiple files sequentially
   */
  async uploadMultipleFiles(
    files: File[],
    endpoint: string,
    onProgress: (progress: UploadProgressData, index: number) => void,
    onFileComplete?: (fileIndex: number, success: boolean) => void,
    additionalData?: Record<string, any>
  ): Promise<UploadProgressData[]> {
    const results: UploadProgressData[] = [];
    const cancelTokens: Map<number, CancelToken> = new Map();

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadFile(
          files[i],
          endpoint,
          (progress) => onProgress(progress, i),
          cancelTokens.get(i),
          additionalData
        );
        results.push(result);
        onFileComplete?.(i, true);
      } catch (error) {
        onFileComplete?.(i, false);
        results.push({
          fileId: `error-${i}`,
          fileName: files[i].name,
          fileSize: files[i].size,
          loaded: 0,
          total: files[i].size,
          percentage: 0,
          uploadSpeed: 0,
          estimatedTimeRemaining: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  }

  /**
   * Cancel an upload by file ID
   */
  cancelUpload(fileId: string, cancelTokenSource: any): void {
    if (cancelTokenSource) {
      cancelTokenSource.cancel('Upload cancelled by user');
    }

    // Cleanup tracking
    this.uploadStartTime.delete(fileId);
    this.lastProgressTime.delete(fileId);
    this.lastLoadedBytes.delete(fileId);
  }

  /**
   * Validate file type
   */
  static validateFileType(
    file: File,
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    const isValidByExtension = allowedTypes.some(
      (type) =>
        fileExtension === type.replace('.', '').toLowerCase() ||
        mimeType.includes(type.replace('.', ''))
    );

    if (!isValidByExtension) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   */
  static validateFileSize(
    file: File,
    maxSizeInMB: number
  ): { valid: boolean; error?: string } {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit. File size: ${this.formatBytes(file.size)}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get file preview URL
   */
  static getFilePreview(file: File): string | null {
    try {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      if (file.type.startsWith('video/')) {
        return URL.createObjectURL(file);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clean up file preview URL
   */
  static revokeFilePreview(url: string): void {
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore errors
      }
    }
  }
}

export default UploadService;

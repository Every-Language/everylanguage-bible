// Core download types
export interface DownloadItem {
  id: string;
  filePath: string;
  fileName: string;
  localPath: string;
  fileSize?: number;
  status: DownloadStatus;
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  signedUrl?: string;
  expiresAt?: Date;
}

export type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number;
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (item: DownloadItem) => void;
  onError?: (error: string) => void;
  priority?: number;
}

export interface BatchDownloadResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    filePath: string;
    success: boolean;
    error?: string;
  }>;
}

export interface DownloadStats {
  totalDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  totalSize: number;
  downloadedSize: number;
}

// URL signing types
export interface SignedUrlRequest {
  filePaths: string[];
  expirationHours: number;
}

export interface SignedUrlResponse {
  success: boolean;
  urls: Record<string, string>;
  expiresIn: number;
  totalFiles: number;
  successfulUrls: number;
  failedFiles?: string[];
  errors?: Record<string, string>;
  fallback?: boolean;
}

// Service configuration
export interface DownloadServiceConfig {
  baseUrl: string;
  apiKey: string;
  downloadsDirectory: string;
  maxConcurrentDownloads: number;
  retryAttempts: number;
  retryDelay: number;
}

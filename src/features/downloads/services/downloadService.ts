import { downloadManager } from './downloadManager';
import { urlSigningService } from './urlSigningService';
import { downloadServiceConfig } from './config';
import {
  DownloadItem,
  DownloadStatus,
  DownloadOptions,
  BatchDownloadResult,
  DownloadStats,
  SignedUrlResponse,
} from './types';

/**
 * Main Download Service - Clean, modular interface for file downloads
 *
 * This service provides a clean API for downloading files with:
 * - URL signing for secure downloads
 * - Progress tracking
 * - Batch operations
 * - Pause/resume functionality
 * - Error handling
 * - Statistics
 */
export class DownloadService {
  /**
   * Download a single file
   */
  async downloadFile(
    filePath: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadItem> {
    return downloadManager.downloadFile(filePath, fileName, options);
  }

  /**
   * Download multiple files in batch
   */
  async downloadBatch(
    files: Array<{ filePath: string; fileName: string }>,
    options: DownloadOptions = {}
  ): Promise<BatchDownloadResult> {
    return downloadManager.downloadBatch(files, options);
  }

  /**
   * Pause a download
   */
  async pauseDownload(id: string): Promise<void> {
    return downloadManager.pauseDownload(id);
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(id: string): Promise<DownloadItem> {
    return downloadManager.resumeDownload(id);
  }

  /**
   * Cancel a download
   */
  async cancelDownload(id: string): Promise<void> {
    return downloadManager.cancelDownload(id);
  }

  /**
   * Get download by ID
   */
  getDownload(id: string): DownloadItem | undefined {
    return downloadManager.getDownload(id);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): DownloadItem[] {
    return downloadManager.getAllDownloads();
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadStatus): DownloadItem[] {
    return downloadManager.getDownloadsByStatus(status);
  }

  /**
   * Delete a download and its file
   */
  async deleteDownload(id: string): Promise<void> {
    return downloadManager.deleteDownload(id);
  }

  /**
   * Clear completed downloads
   */
  async clearCompletedDownloads(): Promise<void> {
    return downloadManager.clearCompletedDownloads();
  }

  /**
   * Get download statistics
   */
  getDownloadStats(): DownloadStats {
    return downloadManager.getDownloadStats();
  }

  /**
   * Get signed URLs for file downloads
   */
  async getDownloadUrls(
    filePaths: string[],
    expirationHours = 24
  ): Promise<SignedUrlResponse> {
    return urlSigningService.getDownloadUrls(filePaths, expirationHours);
  }

  /**
   * Get signed URLs for external URLs
   */
  async getSignedUrlsForExternalUrls(
    urls: string[],
    expirationHours = 24
  ): Promise<SignedUrlResponse> {
    return urlSigningService.getSignedUrlsForExternalUrls(
      urls,
      expirationHours
    );
  }

  /**
   * Validate if a signed URL is still valid
   */
  isUrlValid(expiresAt: string): boolean {
    return urlSigningService.isUrlValid(expiresAt);
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return { ...downloadServiceConfig };
  }

  /**
   * Check if download is active
   */
  isDownloadActive(id: string): boolean {
    const download = this.getDownload(id);
    return download?.status === 'downloading';
  }

  /**
   * Get active downloads count
   */
  getActiveDownloadsCount(): number {
    return this.getDownloadsByStatus('downloading').length;
  }

  /**
   * Get pending downloads count
   */
  getPendingDownloadsCount(): number {
    return this.getDownloadsByStatus('pending').length;
  }

  /**
   * Get completed downloads count
   */
  getCompletedDownloadsCount(): number {
    return this.getDownloadsByStatus('completed').length;
  }

  /**
   * Get failed downloads count
   */
  getFailedDownloadsCount(): number {
    return this.getDownloadsByStatus('failed').length;
  }

  /**
   * Get total downloaded size
   */
  getTotalDownloadedSize(): number {
    const completedDownloads = this.getDownloadsByStatus('completed');
    return completedDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  }

  /**
   * Get total download size
   */
  getTotalDownloadSize(): number {
    const allDownloads = this.getAllDownloads();
    return allDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  }
}

// Export singleton instance
export const downloadService = new DownloadService();

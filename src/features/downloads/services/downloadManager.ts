import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';
import { downloadServiceConfig } from './config';
import { urlSigningService } from './urlSigningService';
import {
  DownloadItem,
  DownloadStatus,
  DownloadProgress,
  DownloadOptions,
  BatchDownloadResult,
  DownloadStats,
} from './types';

export class DownloadManager {
  private downloads = new Map<string, DownloadItem>();
  private downloadResumables = new Map<string, FileSystem.DownloadResumable>();
  private activeDownloads = new Set<string>();

  /**
   * Download a single file
   */
  async downloadFile(
    filePath: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadItem> {
    const id = this.generateId();
    const localPath = `${downloadServiceConfig.downloadsDirectory}${fileName}`;

    const downloadItem: DownloadItem = {
      id,
      filePath,
      fileName,
      localPath,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.downloads.set(id, downloadItem);

    try {
      await this.ensureDownloadsDirectory();

      // Get signed URL
      const signedUrls = await urlSigningService.getSignedUrlsForExternalUrls([
        filePath,
      ]);
      const signedUrl = signedUrls.urls[filePath];

      if (!signedUrl) {
        throw new Error('Failed to get signed URL for file');
      }

      downloadItem.signedUrl = signedUrl;
      downloadItem.expiresAt = new Date(signedUrls.expiresAt);
      downloadItem.status = 'downloading';

      // Check if we can start this download
      if (
        this.activeDownloads.size >=
        downloadServiceConfig.maxConcurrentDownloads
      ) {
        downloadItem.status = 'pending';
        return downloadItem;
      }

      await this.startDownload(downloadItem, options);
      return downloadItem;
    } catch (error: unknown) {
      downloadItem.status = 'failed';
      downloadItem.error = (error as any)?.message || 'Download failed';
      logger.error('Download failed:', {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        errorMessage: (error as any)?.message || 'No message',
        errorStack: (error as any)?.stack || 'No stack',
      });
      throw error;
    }
  }

  /**
   * Download multiple files in batch
   */
  async downloadBatch(
    files: Array<{ filePath: string; fileName: string }>,
    options: DownloadOptions = {}
  ): Promise<BatchDownloadResult> {
    const results: BatchDownloadResult = {
      total: files.length,
      successful: 0,
      failed: 0,
      results: [],
    };

    for (const file of files) {
      try {
        await this.downloadFile(file.filePath, file.fileName, options);
        results.successful++;
        results.results.push({
          filePath: file.filePath,
          success: true,
        });
      } catch (error: unknown) {
        results.failed++;
        results.results.push({
          filePath: file.filePath,
          success: false,
          error: (error as any)?.message || 'Download failed',
        });
      }
    }

    return results;
  }

  /**
   * Pause a download
   */
  async pauseDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error('Download not found');
    }

    const resumable = this.downloadResumables.get(id);
    if (resumable) {
      await resumable.savable();
      download.status = 'paused';
      this.activeDownloads.delete(id);
    }
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(id: string): Promise<DownloadItem> {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error('Download not found');
    }

    if (download.status !== 'paused') {
      throw new Error('Download is not paused');
    }

    const resumable = this.downloadResumables.get(id);
    if (!resumable) {
      throw new Error('Download resumable not found');
    }

    download.status = 'downloading';
    await this.startDownload(download, {});
    return download;
  }

  /**
   * Cancel a download
   */
  async cancelDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error('Download not found');
    }

    const resumable = this.downloadResumables.get(id);
    if (resumable) {
      await resumable.cancelAsync();
      this.downloadResumables.delete(id);
    }

    download.status = 'cancelled';
    this.activeDownloads.delete(id);

    // Clean up the partial file
    try {
      await FileSystem.deleteAsync(download.localPath, { idempotent: true });
    } catch (error) {
      logger.warn('Failed to delete partial file:', error);
    }
  }

  /**
   * Get download by ID
   */
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadStatus): DownloadItem[] {
    return this.getAllDownloads().filter(
      download => download.status === status
    );
  }

  /**
   * Delete a download and its file
   */
  async deleteDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error('Download not found');
    }

    // Cancel if downloading
    if (download.status === 'downloading') {
      await this.cancelDownload(id);
    }

    // Delete the file
    try {
      await FileSystem.deleteAsync(download.localPath, { idempotent: true });
    } catch (error) {
      logger.warn('Failed to delete file:', error);
    }

    this.downloads.delete(id);
    this.downloadResumables.delete(id);
  }

  /**
   * Clear completed downloads
   */
  async clearCompletedDownloads(): Promise<void> {
    const completedDownloads = this.getDownloadsByStatus('completed');

    for (const download of completedDownloads) {
      await this.deleteDownload(download.id);
    }
  }

  /**
   * Get download statistics
   */
  getDownloadStats(): DownloadStats {
    const allDownloads = this.getAllDownloads();
    const completedDownloads = allDownloads.filter(
      d => d.status === 'completed'
    );
    const failedDownloads = allDownloads.filter(d => d.status === 'failed');

    const totalSize = allDownloads.reduce(
      (sum, d) => sum + (d.fileSize || 0),
      0
    );
    const downloadedSize = completedDownloads.reduce(
      (sum, d) => sum + (d.fileSize || 0),
      0
    );

    return {
      totalDownloads: allDownloads.length,
      completedDownloads: completedDownloads.length,
      failedDownloads: failedDownloads.length,
      totalSize,
      downloadedSize,
    };
  }

  /**
   * Start a download
   */
  private async startDownload(
    download: DownloadItem,
    options: DownloadOptions
  ): Promise<void> {
    if (!download.signedUrl) {
      throw new Error('No signed URL available');
    }

    this.activeDownloads.add(download.id);

    const resumable = FileSystem.createDownloadResumable(
      download.signedUrl,
      download.localPath,
      {},
      downloadProgress => {
        const progress: DownloadProgress = {
          bytesWritten: downloadProgress.totalBytesWritten,
          contentLength: downloadProgress.totalBytesExpectedToWrite,
          progress:
            downloadProgress.totalBytesExpectedToWrite > 0
              ? downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite
              : 0,
        };

        download.progress = progress.progress;
        download.fileSize = progress.contentLength;

        options.onProgress?.(progress);
      }
    );

    this.downloadResumables.set(download.id, resumable);

    try {
      await resumable.downloadAsync();
      download.status = 'completed';
      download.completedAt = new Date();
      options.onComplete?.(download);
    } catch (error: unknown) {
      download.status = 'failed';
      const errorMessage = (error as any)?.message || 'Download failed';
      download.error = errorMessage;
      options.onError?.(errorMessage);
      throw error;
    } finally {
      this.activeDownloads.delete(download.id);
    }
  }

  /**
   * Ensure downloads directory exists
   */
  private async ensureDownloadsDirectory(): Promise<void> {
    const downloadsDir = downloadServiceConfig.downloadsDirectory;
    if (!downloadsDir) {
      throw new Error('Downloads directory not configured');
    }

    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, {
        intermediates: true,
      });
    }
  }

  /**
   * Generate unique ID for downloads
   */
  private generateId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const downloadManager = new DownloadManager();

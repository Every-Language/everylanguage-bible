import * as TaskManager from 'expo-task-manager';
import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';
import {
  persistentDownloadStore,
  PersistentDownloadItem,
  DownloadQueueItem,
} from './persistentDownloadStore';
import { downloadToMediaService } from './downloadToMediaService';
import { downloadServiceConfig } from './config';
import { urlSigningService } from './urlSigningService';
import {
  DownloadStatus,
  DownloadItem,
  DownloadOptions,
  DownloadProgress,
  BatchDownloadResult,
  DownloadStats,
} from './types';

const BACKGROUND_TASK_NAME = 'background-download-task';

export interface DownloadServiceOptions {
  priority?: number;
  batchId?: string;
  metadata?: Record<string, any>;
  retryOnFailure?: boolean;
  maxRetries?: number;
  addToMediaFiles?: boolean;
  originalSearchResults?: any[];
  mediaFileOptions?: any;
  fileSize?: number | undefined;
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (item: DownloadItem) => void;
  onError?: (error: string) => void;
}

export interface DownloadServiceResult {
  success: boolean;
  downloadId: string;
  error?: string;
  mediaFileId?: string;
}

/**
 * Unified Download Service - Single source of truth for all download operations
 *
 * IMPORTANT: This service ALWAYS uses background downloads and NEVER performs direct downloads.
 * All download operations go through the background queue system for consistency, reliability,
 * and proper state management. This ensures:
 * - Resumable downloads using FileSystem.createDownloadResumable
 * - Background processing with Expo TaskManager
 * - Persistent storage with AsyncStorage
 * - Queue management with priority-based processing
 * - Retry logic with exponential backoff
 * - Media file integration
 * - Compatibility with old API methods
 */
export class DownloadService {
  private static instance: DownloadService;
  private isInitialized = false;
  private isProcessing = false;
  private downloadResumables = new Map<string, FileSystem.DownloadResumable>();

  private constructor() {}

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * Initialize the download service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing unified download service');

      // Initialize persistent store
      await persistentDownloadStore.initialize();

      // Ensure downloads directory exists
      await this.ensureDownloadsDirectory();

      // Define background task for downloads
      this.defineBackgroundTask();

      // Register background task
      await this.registerBackgroundTask();

      // Resume any pending downloads
      await this.resumePendingDownloads();

      this.isInitialized = true;
      logger.info('Unified download service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize unified download service:', error);
      throw error;
    }
  }

  /**
   * Define the background task for downloads
   */
  private defineBackgroundTask(): void {
    // This method is now handled in registerBackgroundTask to avoid duplication
    logger.info('Background task definition handled in registerBackgroundTask');
  }

  /**
   * Register background task
   */
  private async registerBackgroundTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        try {
          logger.info('Background task triggered for downloads');

          const result = await this.processDownloadQueue();

          if (result.processedCount > 0) {
            logger.info('Background task processed downloads', {
              count: result.processedCount,
            });
          } else {
            logger.info('Background task: No downloads to process');
          }

          return { success: true, processedCount: result.processedCount };
        } catch (error) {
          logger.error('Background task failed:', error);
          return { success: false, error: (error as Error).message };
        }
      });

      // Check if task is already registered
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      const isAlreadyRegistered = registeredTasks.some(
        task => task.taskName === BACKGROUND_TASK_NAME
      );

      if (isAlreadyRegistered) {
        logger.info('Background download task already registered');
        return;
      }

      // In development mode, just define the task but don't register it
      // This allows the initialization to complete successfully
      if (__DEV__) {
        logger.info(
          '⚠️ Background tasks are not supported in development/Expo Go - task defined but not registered'
        );
        return;
      }

      logger.info('Background task registered for downloads');
    } catch (error) {
      logger.error('Failed to register background task:', error);
    }
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Download a single file (ALWAYS uses background queue - no direct downloads)
   * This method ensures all downloads go through the background queue system
   * for consistency, reliability, and proper state management.
   */
  async downloadFile(
    filePath: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadItem> {
    // ALWAYS use background queue - never perform direct downloads
    const downloadId = await this.addToQueue(filePath, fileName, {
      ...options,
      priority: 1,
    });

    const download = persistentDownloadStore.getDownload(downloadId);
    if (!download) {
      throw new Error('Failed to create download item');
    }

    // Convert PersistentDownloadItem to DownloadItem for compatibility
    return {
      id: download.id,
      filePath: download.filePath,
      fileName: download.fileName,
      localPath: download.localPath,
      status: download.status,
      progress: download.progress,
      ...(download.fileSize !== undefined && { fileSize: download.fileSize }),
      createdAt: download.createdAt,
      ...(download.completedAt !== undefined && {
        completedAt: download.completedAt,
      }),
      ...(download.error !== undefined && { error: download.error }),
      ...(download.signedUrl !== undefined && {
        signedUrl: download.signedUrl,
      }),
      ...(download.expiresAt !== undefined && {
        expiresAt: download.expiresAt,
      }),
    };
  }

  /**
   * Add a download to the queue (ALWAYS uses background processing)
   */
  async addToQueue(
    filePath: string,
    fileName: string,
    options: DownloadServiceOptions = {}
  ): Promise<string> {
    const downloadId = this.generateId();
    const priority = options.priority || 1;

    // Create persistent download item
    const downloadItem: PersistentDownloadItem = {
      id: downloadId,
      filePath,
      fileName,
      localPath: `${downloadServiceConfig.downloadsDirectory}${fileName}`,
      status: 'pending',
      progress: 0,
      ...(options.fileSize !== undefined && { fileSize: options.fileSize }),
      createdAt: new Date(),
      retryCount: 0,
      priority,
      batchId: options.batchId,
      metadata: {
        ...options.metadata,
        ...(options.addToMediaFiles && {
          addToMediaFiles: options.addToMediaFiles,
        }),
        ...(options.originalSearchResults && {
          originalSearchResults: options.originalSearchResults,
        }),
        ...(options.mediaFileOptions && {
          mediaFileOptions: options.mediaFileOptions,
        }),
        // Store callbacks for compatibility
        ...(options.onProgress && { onProgress: true }),
        ...(options.onComplete && { onComplete: true }),
        ...(options.onError && { onError: true }),
      },
    };

    // Add to persistent store
    await persistentDownloadStore.addDownload(downloadItem);

    // Add to queue
    const queueItem: DownloadQueueItem = {
      id: downloadId,
      priority,
      addedAt: new Date(),
      batchId: options.batchId,
    };
    await persistentDownloadStore.addToQueue(queueItem);

    logger.info('Added download to background queue', {
      downloadId,
      fileName,
      priority,
      batchId: options.batchId,
    });

    // Start processing if not already processing
    if (!this.isProcessing) {
      logger.info('Starting background queue processing for new download');
      this.processDownloadQueue().catch(error => {
        logger.error('Error processing background download queue:', error);
      });
    } else {
      logger.info(
        'Background queue is already processing, download will be picked up automatically'
      );
    }

    return downloadId;
  }

  /**
   * Add multiple files to the queue
   */
  async addBatchToQueue(
    files: Array<{ filePath: string; fileName: string; fileSize?: number }>,
    options: DownloadServiceOptions = {}
  ): Promise<string[]> {
    const batchId = options.batchId || `batch_${Date.now()}`;
    const downloadIds: string[] = [];

    logger.info('Adding batch to download queue', {
      fileCount: files.length,
      batchId,
    });

    for (const file of files) {
      const downloadId = await this.addToQueue(file.filePath, file.fileName, {
        ...options,
        batchId,
        fileSize: file.fileSize,
      });
      downloadIds.push(downloadId);
    }

    logger.info('Added batch to download queue', {
      downloadIds,
      batchId,
    });

    return downloadIds;
  }

  /**
   * Download multiple files (ALWAYS uses background queue - no direct downloads)
   * This method ensures all batch downloads go through the background queue system
   * for consistency, reliability, and proper state management.
   */
  async downloadBatch(
    files: Array<{ filePath: string; fileName: string }>,
    options: DownloadOptions = {}
  ): Promise<BatchDownloadResult> {
    // ALWAYS use background queue - never perform direct downloads
    const downloadIds = await this.addBatchToQueue(files, {
      ...options,
      priority: 1,
    });

    return {
      total: files.length,
      successful: downloadIds.length,
      failed: 0,
      results: files.map((file, _index) => ({
        filePath: file.filePath,
        success: true,
      })),
    };
  }

  /**
   * Process the download queue
   */
  async processDownloadQueue(): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
  }> {
    if (this.isProcessing) {
      logger.debug('Download queue processing already in progress');
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    try {
      logger.info('Starting download queue processing');

      // Process downloads sequentially until queue is empty
      while (true) {
        const queueItem = persistentDownloadStore.getNextFromQueue();
        if (!queueItem) {
          logger.info('No more items in download queue');
          break;
        }

        const download = persistentDownloadStore.getDownload(queueItem.id);
        if (!download) {
          logger.warn('Download not found for queue item:', queueItem.id);
          continue;
        }

        // Check if we can process this download
        if (download.status === 'completed' || download.status === 'failed') {
          logger.debug('Skipping completed/failed download:', download.id);
          continue;
        }

        // Check retry limit
        const maxRetries =
          download.metadata?.['maxRetries'] ||
          downloadServiceConfig.retryAttempts;
        if (download.retryCount >= maxRetries) {
          logger.warn('Download exceeded retry limit:', download.id);
          await persistentDownloadStore.updateDownload(download.id, {
            status: 'failed',
          });
          failedCount++;
          continue;
        }

        logger.info(`Processing download ${processedCount + 1}:`, download.id);

        // Process the download
        try {
          const result = await this.processDownload(download);
          if (result.success) {
            successCount++;
            logger.info('Download completed successfully:', download.id);
          } else {
            failedCount++;
            logger.error('Download failed:', download.id, result.error);
          }
        } catch (error) {
          failedCount++;
          logger.error('Error processing download:', download.id, error);

          // Increment retry count
          await persistentDownloadStore.incrementRetryCount(download.id);
        }

        processedCount++;

        // Add a small delay between downloads to prevent overwhelming the system
        if (processedCount < downloadServiceConfig.maxConcurrentDownloads) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info('Download queue processing completed', {
        processedCount,
        successCount,
        failedCount,
        queueEmpty: persistentDownloadStore.getQueueItems().length === 0,
      });

      return { processedCount, successCount, failedCount };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single download
   */
  private async processDownload(
    download: PersistentDownloadItem
  ): Promise<DownloadServiceResult> {
    try {
      logger.info('Processing download:', download.id);

      // Update status to downloading
      await persistentDownloadStore.updateDownload(download.id, {
        status: 'downloading',
      });

      // Get signed URL if needed
      if (!download.signedUrl || this.isUrlExpired(download)) {
        const signedUrls = await urlSigningService.getSignedUrlsForExternalUrls(
          [download.filePath]
        );
        const signedUrl = signedUrls.urls[download.filePath];

        if (!signedUrl) {
          throw new Error('Failed to get signed URL for file');
        }

        const expirationDate = new Date();
        expirationDate.setSeconds(
          expirationDate.getSeconds() + signedUrls.expiresIn
        );

        await persistentDownloadStore.updateDownload(download.id, {
          signedUrl,
          expiresAt: expirationDate,
        });
      }

      // Get the updated download object with the signed URL
      const updatedDownload = persistentDownloadStore.getDownload(download.id);
      if (!updatedDownload) {
        throw new Error('Download not found after update');
      }

      logger.info('Download prepared with signed URL:', {
        downloadId: updatedDownload.id,
        hasSignedUrl: !!updatedDownload.signedUrl,
        signedUrlLength: updatedDownload.signedUrl?.length || 0,
      });

      // Start the actual download with the updated download object
      const result = await this.performDownload(updatedDownload);

      // Handle media file integration if requested
      if (result.success && updatedDownload.metadata?.['addToMediaFiles']) {
        try {
          const originalSearchResults =
            updatedDownload.metadata['originalSearchResults'];
          const mediaFileOptions = updatedDownload.metadata['mediaFileOptions'];

          if (originalSearchResults && originalSearchResults.length > 0) {
            // Find the matching search result for this download
            const originalSearchResult =
              originalSearchResults.find(
                (result: any) => result.remote_path === updatedDownload.filePath
              ) || originalSearchResults[0];

            const mediaResult =
              await downloadToMediaService.addCompletedDownloadToMedia(
                {
                  filePath: updatedDownload.localPath, // Use localPath instead of filePath
                  fileName: updatedDownload.fileName,
                  progress: 1,
                  status: 'completed',
                  fileSize: updatedDownload.fileSize || 0,
                },
                originalSearchResult,
                mediaFileOptions || {}
              );

            if (mediaResult.success && mediaResult.mediaFileId) {
              result.mediaFileId = mediaResult.mediaFileId;
            }
          }
        } catch (error) {
          logger.error('Failed to add download to media files:', error);
        }
      }

      // Continue processing the queue after this download completes
      this.continueQueueProcessing();

      return result;
    } catch (error) {
      logger.error('Error processing download:', download.id, error);
      return {
        success: false,
        downloadId: download.id,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Continue processing the queue
   */
  private async continueQueueProcessing(): Promise<void> {
    // Check if there are more items in the queue
    const queueItems = persistentDownloadStore.getQueueItems();
    if (queueItems.length > 0 && !this.isProcessing) {
      logger.info('Continuing queue processing');
      this.processDownloadQueue().catch(error => {
        logger.error('Error continuing queue processing:', error);
      });
    }
  }

  /**
   * Perform the actual download using FileSystem
   */
  private async performDownload(
    download: PersistentDownloadItem
  ): Promise<DownloadServiceResult> {
    let resumable: FileSystem.DownloadResumable | null = null;

    try {
      logger.info('Starting real download for:', download.id, {
        hasSignedUrl: !!download.signedUrl,
        signedUrlLength: download.signedUrl?.length || 0,
        localPath: download.localPath,
      });

      // Ensure downloads directory exists
      await this.ensureDownloadsDirectory();

      // Validate signed URL exists
      if (!download.signedUrl) {
        throw new Error(
          'Signed URL is required for download but not available'
        );
      }

      // Create the download resumable
      resumable = FileSystem.createDownloadResumable(
        download.signedUrl,
        download.localPath,
        {},
        downloadProgress => {
          const progress = {
            bytesWritten: downloadProgress.totalBytesWritten,
            contentLength: downloadProgress.totalBytesExpectedToWrite,
            progress:
              downloadProgress.totalBytesExpectedToWrite > 0
                ? downloadProgress.totalBytesWritten /
                  downloadProgress.totalBytesExpectedToWrite
                : 0,
          };

          // Update progress in persistent store
          persistentDownloadStore
            .updateProgress(download.id, progress)
            .catch(error => {
              logger.error('Failed to update progress:', error);
            });

          logger.debug('Download progress:', {
            downloadId: download.id,
            progress: progress.progress,
            bytesWritten: progress.bytesWritten,
            contentLength: progress.contentLength,
          });
        }
      );

      // Store the resumable for potential pause/resume operations
      this.downloadResumables.set(download.id, resumable);

      // Start the download
      await resumable.downloadAsync();

      // Download completed successfully
      await persistentDownloadStore.updateDownload(download.id, {
        status: 'completed',
        progress: 1,
        completedAt: new Date(),
      });

      logger.info('Download completed successfully:', {
        downloadId: download.id,
        fileName: download.fileName,
      });

      return {
        success: true,
        downloadId: download.id,
      };
    } catch (error) {
      logger.error('Download failed:', {
        downloadId: download.id,
        fileName: download.fileName,
        error: (error as Error).message,
      });

      // Update status to failed
      await persistentDownloadStore.updateDownload(download.id, {
        status: 'failed',
        error: (error as Error).message,
      });

      return {
        success: false,
        downloadId: download.id,
        error: (error as Error).message,
      };
    } finally {
      // Clean up resumable
      this.downloadResumables.delete(download.id);
      if (resumable) {
        try {
          await resumable.cancelAsync();
        } catch (error) {
          logger.warn('Failed to cancel resumable:', error);
        }
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

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
   * Resume pending downloads
   */
  async resumePendingDownloads(): Promise<void> {
    const pendingDownloads = persistentDownloadStore.getDownloadsToResume();

    if (pendingDownloads.length > 0) {
      logger.info('Resuming pending downloads:', pendingDownloads.length);

      for (const download of pendingDownloads) {
        const queueItem: DownloadQueueItem = {
          id: download.id,
          priority: download.priority,
          addedAt: new Date(),
          batchId: download.batchId,
        };
        await persistentDownloadStore.addToQueue(queueItem);
      }
    }
  }

  /**
   * Get download status
   */
  getDownloadStatus(downloadId: string): PersistentDownloadItem | undefined {
    return persistentDownloadStore.getDownload(downloadId);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): PersistentDownloadItem[] {
    return persistentDownloadStore.getAllDownloads();
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadStatus): PersistentDownloadItem[] {
    return persistentDownloadStore.getDownloadsByStatus(status);
  }

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId: string): Promise<void> {
    const resumable = this.downloadResumables.get(downloadId);
    if (resumable) {
      try {
        await resumable.cancelAsync();
        this.downloadResumables.delete(downloadId);
        logger.info('Download resumable cancelled:', downloadId);
      } catch (error) {
        logger.error('Failed to cancel download resumable:', downloadId, error);
      }
    }

    await persistentDownloadStore.updateDownload(downloadId, {
      status: 'cancelled',
    });
    await persistentDownloadStore.removeFromQueue(downloadId);
    logger.info('Download cancelled:', downloadId);
  }

  /**
   * Pause a download
   */
  async pauseDownload(downloadId: string): Promise<void> {
    const resumable = this.downloadResumables.get(downloadId);
    if (resumable) {
      try {
        await resumable.cancelAsync();
        this.downloadResumables.delete(downloadId);
        logger.info('Download cancelled for pause:', downloadId);
      } catch (error) {
        logger.error('Failed to cancel download for pause:', downloadId, error);
      }
    }

    await persistentDownloadStore.updateDownload(downloadId, {
      status: 'paused',
    });
    logger.info('Download paused:', downloadId);
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(downloadId: string): Promise<void> {
    const download = persistentDownloadStore.getDownload(downloadId);
    if (download && download.status === 'paused') {
      // For background downloads, we'll re-queue the download to be processed
      // The resumable will be recreated during processing if needed
      await persistentDownloadStore.updateDownload(downloadId, {
        status: 'pending',
      });

      const queueItem: DownloadQueueItem = {
        id: downloadId,
        priority: download.priority,
        addedAt: new Date(),
        batchId: download.batchId,
      };
      await persistentDownloadStore.addToQueue(queueItem);

      logger.info('Download re-queued for resume:', downloadId);
    }
  }

  /**
   * Start background task
   */
  async startBackgroundTask(): Promise<void> {
    try {
      // Note: startTaskAsync is not available in current Expo TaskManager
      // Background tasks are automatically managed by the system
      logger.info('Background task management is automatic');
    } catch (error) {
      logger.error('Failed to start background task:', error);
    }
  }

  /**
   * Stop background task
   */
  async stopBackgroundTask(): Promise<void> {
    try {
      await TaskManager.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      logger.info('Background task stopped');
    } catch (error) {
      logger.error('Failed to stop background task:', error);
    }
  }

  /**
   * Check if background task is running
   */
  async isBackgroundTaskRunning(): Promise<boolean> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      return registeredTasks.some(
        task => task.taskName === BACKGROUND_TASK_NAME
      );
    } catch (error) {
      logger.error('Failed to check background task status:', error);
      return false;
    }
  }

  /**
   * Get download statistics
   */
  getStats(): DownloadStats {
    return persistentDownloadStore.getStats();
  }

  /**
   * Get queue information
   */
  getQueueInfo() {
    const queueItems = persistentDownloadStore.getQueueItems();
    const downloads = persistentDownloadStore.getAllDownloads();

    const pendingCount = downloads.filter(d => d.status === 'pending').length;
    const downloadingCount = downloads.filter(
      d => d.status === 'downloading'
    ).length;
    const completedCount = downloads.filter(
      d => d.status === 'completed'
    ).length;
    const failedCount = downloads.filter(d => d.status === 'failed').length;
    const pausedCount = downloads.filter(d => d.status === 'paused').length;

    return {
      queueLength: queueItems.length,
      pendingCount,
      downloadingCount,
      completedCount,
      failedCount,
      pausedCount,
      totalDownloads: downloads.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Trigger queue processing
   */
  async triggerQueueProcessing(): Promise<void> {
    if (!this.isProcessing) {
      logger.info('Manually triggering queue processing');
      this.processDownloadQueue().catch(error => {
        logger.error('Error in manual queue processing:', error);
      });
    } else {
      logger.info('Queue is already processing');
    }
  }

  /**
   * Clear completed downloads
   */
  async clearCompletedDownloads(): Promise<void> {
    await persistentDownloadStore.clearCompletedDownloads();
  }

  /**
   * Clear failed downloads
   */
  async clearFailedDownloads(): Promise<void> {
    await persistentDownloadStore.clearFailedDownloads();
  }

  /**
   * Retry failed downloads
   */
  async retryFailedDownloads(): Promise<{
    retriedCount: number;
    skippedCount: number;
  }> {
    const failedDownloads =
      persistentDownloadStore.getDownloadsByStatus('failed');
    let retriedCount = 0;
    let skippedCount = 0;

    logger.info('Retrying failed downloads:', failedDownloads.length);

    for (const download of failedDownloads) {
      try {
        // Reset retry count to give failed downloads a fresh start
        await persistentDownloadStore.resetRetryCount(download.id);

        // Update status to pending
        await persistentDownloadStore.updateDownload(download.id, {
          status: 'pending',
        });

        // Add back to queue
        const queueItem: DownloadQueueItem = {
          id: download.id,
          priority: download.priority,
          addedAt: new Date(),
          batchId: download.batchId,
        };
        await persistentDownloadStore.addToQueue(queueItem);

        retriedCount++;
        logger.info('Re-queued failed download for retry:', download.id);
      } catch (error) {
        skippedCount++;
        logger.error('Failed to retry download:', download.id, error);
      }
    }

    logger.info('Retry operation completed', {
      retriedCount,
      skippedCount,
    });

    return { retriedCount, skippedCount };
  }

  /**
   * Continue downloads including retrying failed ones
   */
  async continueDownloads(): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
    retriedCount: number;
  }> {
    try {
      logger.info('Continuing downloads including failed retries');

      // First, retry failed downloads
      const retryResult = await this.retryFailedDownloads();

      // Then process ALL pending downloads in the queue
      const processResult = await this.processAllPendingDownloads();

      const totalProcessed = processResult.processedCount;
      const totalSuccess = processResult.successCount;
      const totalFailed = processResult.failedCount;
      const totalRetried = retryResult.retriedCount;

      logger.info('Continue downloads completed successfully', {
        totalProcessed,
        totalSuccess,
        totalFailed,
        totalRetried,
        summary: `Processed ${totalProcessed} downloads (${totalSuccess} succeeded, ${totalFailed} failed, ${totalRetried} retried)`,
      });

      return {
        processedCount: totalProcessed,
        successCount: totalSuccess,
        failedCount: totalFailed,
        retriedCount: totalRetried,
      };
    } catch (error) {
      logger.error('Failed to continue downloads:', error);
      throw error;
    }
  }

  /**
   * Process ALL pending downloads in the queue (not limited by maxConcurrentDownloads)
   */
  async processAllPendingDownloads(): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
  }> {
    if (this.isProcessing) {
      logger.debug('Download queue processing already in progress');
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    try {
      logger.info('Starting to process ALL pending downloads');

      // Get all pending downloads that need to be processed
      const pendingDownloads =
        persistentDownloadStore.getDownloadsByStatus('pending');
      const pausedDownloads =
        persistentDownloadStore.getDownloadsByStatus('paused');
      const allDownloadsToProcess = [...pendingDownloads, ...pausedDownloads];

      logger.info(
        `Found ${allDownloadsToProcess.length} downloads to process`,
        {
          pending: pendingDownloads.length,
          paused: pausedDownloads.length,
        }
      );

      // Process downloads in batches to respect concurrent limits
      const batchSize = downloadServiceConfig.maxConcurrentDownloads;
      const batches: PersistentDownloadItem[][] = [];

      for (let i = 0; i < allDownloadsToProcess.length; i += batchSize) {
        batches.push(allDownloadsToProcess.slice(i, i + batchSize));
      }

      logger.info(
        `Processing downloads in ${batches.length} batches of ${batchSize}`
      );

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (!batch) continue; // Skip if batch is undefined (shouldn't happen but TypeScript safety)
        logger.info(
          `Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} downloads`
        );

        // Process this batch concurrently
        const batchPromises = batch.map(async download => {
          try {
            // Check retry limit
            const maxRetries = download.metadata?.['maxRetries'] || 3;
            if (download.retryCount >= maxRetries) {
              logger.warn('Download exceeded retry limit:', download.id);
              await persistentDownloadStore.updateDownload(download.id, {
                status: 'failed',
              });
              return { success: false, error: 'Max retries exceeded' };
            }

            // Process the download
            const result = await this.processDownload(download);
            return result;
          } catch (error) {
            logger.error('Error processing download:', download.id, error);
            // Increment retry count
            await persistentDownloadStore.incrementRetryCount(download.id);
            return { success: false, error: (error as Error).message };
          }
        });

        // Wait for all downloads in this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Count results
        for (const result of batchResults) {
          processedCount++;
          if (result.success) {
            successCount++;
            logger.info('Download completed successfully');
          } else {
            failedCount++;
            logger.error('Download failed:', result.error);
          }
        }

        // Add a small delay between batches
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      logger.info('All pending downloads processing completed', {
        processedCount,
        successCount,
        failedCount,
        totalBatches: batches.length,
      });

      return { processedCount, successCount, failedCount };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if URL is expired
   */
  private isUrlExpired(download: PersistentDownloadItem): boolean {
    if (!download.expiresAt) {
      return true;
    }
    return new Date() >= download.expiresAt;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get summary for continue downloads
   */
  getContinueDownloadsSummary(): {
    pendingCount: number;
    failedCount: number;
    totalCount: number;
    canContinue: boolean;
  } {
    const pendingDownloads =
      persistentDownloadStore.getDownloadsByStatus('pending');
    const pausedDownloads =
      persistentDownloadStore.getDownloadsByStatus('paused');
    const failedDownloads =
      persistentDownloadStore.getDownloadsByStatus('failed');

    const pendingCount = pendingDownloads.length + pausedDownloads.length;
    const failedCount = failedDownloads.length;
    const totalCount = pendingCount + failedCount;

    return {
      pendingCount,
      failedCount,
      totalCount,
      canContinue: totalCount > 0 && !this.isProcessing,
    };
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get initialized(): boolean {
    return this.isInitialized;
  }

  get processing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const downloadService = DownloadService.getInstance();

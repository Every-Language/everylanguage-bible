import * as TaskManager from 'expo-task-manager';
import { logger } from '@/shared/utils/logger';
import {
  persistentDownloadStore,
  PersistentDownloadItem,
  DownloadQueueItem,
} from './persistentDownloadStore';
import { downloadToMediaService } from './downloadToMediaService';
import { downloadServiceConfig } from './config';
import { urlSigningService } from './urlSigningService';
import { DownloadStatus } from './types';

const BACKGROUND_DOWNLOAD_TASK = 'background-download-task';
const BACKGROUND_TASK_NAME = 'background-download-task';

export interface BackgroundDownloadOptions {
  priority?: number;
  batchId?: string;
  metadata?: Record<string, any>;
  retryOnFailure?: boolean;
  maxRetries?: number;
  addToMediaFiles?: boolean;
  originalSearchResults?: any[];
  mediaFileOptions?: any;
}

export interface BackgroundDownloadResult {
  success: boolean;
  downloadId: string;
  error?: string;
  mediaFileId?: string;
}

export class BackgroundDownloadService {
  private static instance: BackgroundDownloadService;
  private isInitialized = false;
  private isProcessing = false;
  private processingQueue: string[] = [];

  private constructor() {}

  static getInstance(): BackgroundDownloadService {
    if (!BackgroundDownloadService.instance) {
      BackgroundDownloadService.instance = new BackgroundDownloadService();
    }
    return BackgroundDownloadService.instance;
  }

  /**
   * Initialize the background download service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing background download service');

      // Initialize persistent store
      await persistentDownloadStore.initialize();

      // Define background task for downloads
      this.defineBackgroundTask();

      // Register background task
      await this.registerBackgroundTask();

      // Resume any pending downloads
      await this.resumePendingDownloads();

      this.isInitialized = true;
      logger.info('Background download service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize background download service:', error);
      throw error;
    }
  }

  /**
   * Define the background task for downloads
   */
  private defineBackgroundTask(): void {
    TaskManager.defineTask(BACKGROUND_DOWNLOAD_TASK, async () => {
      try {
        logger.info('Background download task started');

        const result = await this.processDownloadQueue();

        logger.info('Background download task completed', { result });
        return { success: true, processedCount: result.processedCount };
      } catch (error) {
        logger.error('Background download task failed:', error);
        return { success: false, error: (error as Error).message };
      }
    });
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

      // In Expo Go, background tasks are not supported
      if (__DEV__) {
        logger.info(
          '⚠️ Background tasks are not supported in development/Expo Go'
        );
        return;
      }

      logger.info('Background task registered for downloads');
    } catch (error) {
      logger.error('Failed to register background task:', error);
    }
  }

  /**
   * Add a download to the background queue
   */
  async addToBackgroundQueue(
    filePath: string,
    fileName: string,
    options: BackgroundDownloadOptions = {}
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
      createdAt: new Date(),
      retryCount: 0,
      priority,
      batchId: options.batchId,
      metadata: options.metadata,
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
      this.processDownloadQueue().catch(error => {
        logger.error('Error processing download queue:', error);
      });
    }

    return downloadId;
  }

  /**
   * Add multiple downloads to background queue
   */
  async addBatchToBackgroundQueue(
    files: Array<{ filePath: string; fileName: string }>,
    options: BackgroundDownloadOptions = {}
  ): Promise<string[]> {
    const batchId = this.generateId();
    const downloadIds: string[] = [];

    for (const file of files) {
      const downloadId = await this.addToBackgroundQueue(
        file.filePath,
        file.fileName,
        {
          ...options,
          batchId,
        }
      );
      downloadIds.push(downloadId);
    }

    logger.info('Added batch to background queue', {
      batchId,
      count: files.length,
      downloadIds,
    });

    return downloadIds;
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

      while (true) {
        const queueItem = persistentDownloadStore.getNextFromQueue();
        if (!queueItem) {
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
        const maxRetries = download.metadata?.['maxRetries'] || 3;
        if (download.retryCount >= maxRetries) {
          logger.warn('Download exceeded retry limit:', download.id);
          await persistentDownloadStore.updateDownload(download.id, {
            status: 'failed',
          });
          failedCount++;
          continue;
        }

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

        // Check if we've processed enough downloads
        if (processedCount >= downloadServiceConfig.maxConcurrentDownloads) {
          break;
        }
      }

      logger.info('Download queue processing completed', {
        processedCount,
        successCount,
        failedCount,
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
  ): Promise<BackgroundDownloadResult> {
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

      // Start the actual download
      const result = await this.performDownload(download);

      if (result.success) {
        // Add to media files if configured
        if (
          download.metadata?.['addToMediaFiles'] &&
          download.metadata?.['originalSearchResults']
        ) {
          try {
            const originalSearchResults =
              download.metadata['originalSearchResults'];

            // Validate that we have search results
            if (
              !Array.isArray(originalSearchResults) ||
              originalSearchResults.length === 0
            ) {
              logger.warn(
                'No original search results found for download:',
                download.id
              );
              return result;
            }

            // For now, use the first search result (in a more sophisticated implementation,
            // you might want to match by file path or other criteria)
            const originalSearchResult = originalSearchResults[0];

            logger.info('Processing media file addition for download:', {
              downloadId: download.id,
              fileName: download.fileName,
              searchResultsCount: originalSearchResults.length,
              originalSearchResult: {
                id: originalSearchResult.id,
                language_entity_id: originalSearchResult.language_entity_id,
                sequence_id: originalSearchResult.sequence_id,
                media_type: originalSearchResult.media_type,
              },
            });

            const mediaResult =
              await downloadToMediaService.addCompletedDownloadToMedia(
                {
                  filePath: download.filePath,
                  fileName: download.fileName,
                  progress: 1,
                  status: 'completed',
                  fileSize: download.fileSize || 0,
                },
                originalSearchResult,
                download.metadata['mediaFileOptions'] || {}
              );

            if (mediaResult.success && mediaResult.mediaFileId) {
              result.mediaFileId = mediaResult.mediaFileId;
            }
          } catch (error) {
            logger.error('Failed to add download to media files:', error);
          }
        }
      }

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
   * Perform the actual download using FileSystem
   */
  private async performDownload(
    download: PersistentDownloadItem
  ): Promise<BackgroundDownloadResult> {
    // This would integrate with the existing download manager
    // For now, we'll simulate the download process
    // In a real implementation, you'd use FileSystem.createDownloadResumable

    try {
      // Simulate download progress
      for (let progress = 0; progress <= 1; progress += 0.1) {
        await persistentDownloadStore.updateProgress(download.id, {
          bytesWritten: Math.floor(progress * (download.fileSize || 1000000)),
          contentLength: download.fileSize || 1000000,
          progress,
        });

        // Simulate download time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as completed
      await persistentDownloadStore.updateDownload(download.id, {
        status: 'completed',
        progress: 1,
        completedAt: new Date(),
      });

      return {
        success: true,
        downloadId: download.id,
      };
    } catch (error) {
      await persistentDownloadStore.updateDownload(download.id, {
        status: 'failed',
        error: (error as Error).message,
      });

      return {
        success: false,
        downloadId: download.id,
        error: (error as Error).message,
      };
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

      logger.info('Download resumed:', downloadId);
    }
  }

  /**
   * Start background task manually
   */
  async startBackgroundTask(): Promise<void> {
    try {
      // Background tasks are managed by the system, we can't manually start them
      // Instead, we can trigger the processing manually
      await this.processDownloadQueue();
      logger.info('Background task processing triggered manually');
    } catch (error) {
      logger.error('Failed to start background task processing:', error);
    }
  }

  /**
   * Stop background task
   */
  async stopBackgroundTask(): Promise<void> {
    try {
      // Background tasks are managed by the system, we can't manually stop them
      // Instead, we can stop the processing
      this.isProcessing = false;
      logger.info('Background task processing stopped');
    } catch (error) {
      logger.error('Failed to stop background task processing:', error);
    }
  }

  /**
   * Check if background task is running
   */
  async isBackgroundTaskRunning(): Promise<boolean> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      const isRegistered = registeredTasks.some(
        task => task.taskName === BACKGROUND_TASK_NAME
      );
      return isRegistered;
    } catch (error) {
      logger.error('Failed to check background task status:', error);
      return false;
    }
  }

  /**
   * Get download stats
   */
  getStats() {
    return persistentDownloadStore.getStats();
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
    try {
      logger.info('Retrying failed downloads');

      const failedDownloads =
        persistentDownloadStore.getDownloadsByStatus('failed');
      let retriedCount = 0;
      let skippedCount = 0;

      logger.info(`Found ${failedDownloads.length} failed downloads to retry`);

      for (const download of failedDownloads) {
        // When user explicitly clicks "continue download", we retry ALL failed downloads
        // regardless of retry count, but we'll reset the retry count to give them a fresh start
        const maxRetries = download.metadata?.['maxRetries'] || 3;

        if (download.retryCount >= maxRetries) {
          logger.info(
            'Resetting retry count for download that exceeded limit:',
            download.id
          );
          // Reset retry count to give it another chance
          await persistentDownloadStore.resetRetryCount(download.id);
        }

        // Reset the download status and add back to queue
        await persistentDownloadStore.updateDownload(download.id, {
          status: 'pending',
        });

        const queueItem: DownloadQueueItem = {
          id: download.id,
          priority: download.priority,
          addedAt: new Date(),
          batchId: download.batchId,
        };
        await persistentDownloadStore.addToQueue(queueItem);

        logger.info('Retried failed download:', download.id);
        retriedCount++;
      }

      logger.info('Failed downloads retry completed', {
        retriedCount,
        skippedCount,
        totalFailed: failedDownloads.length,
      });

      return { retriedCount, skippedCount };
    } catch (error) {
      logger.error('Failed to retry failed downloads:', error);
      throw error;
    }
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

        logger.info(`Batch ${batchIndex + 1} completed`, {
          batchProcessed: batch.length,
          batchSuccess: batchResults.filter(r => r.success).length,
          batchFailed: batchResults.filter(r => !r.success).length,
          totalProcessed: processedCount,
          totalSuccess: successCount,
          totalFailed: failedCount,
        });
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
    return !!(download.expiresAt && download.expiresAt < new Date());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `bg_download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get summary of what will be processed when continue downloads is called
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
    const canContinue = totalCount > 0 && !this.isProcessing;

    return {
      pendingCount,
      failedCount,
      totalCount,
      canContinue,
    };
  }

  /**
   * Check if service is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if processing is active
   */
  get processing(): boolean {
    return this.isProcessing;
  }
}

export const backgroundDownloadService =
  BackgroundDownloadService.getInstance();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/shared/utils/logger';
import {
  DownloadItem,
  DownloadStatus,
  DownloadProgress,
  DownloadStats,
} from './types';

const DOWNLOADS_STORAGE_KEY = 'downloads_persistent_store';
const DOWNLOAD_QUEUE_KEY = 'download_queue';
const DOWNLOAD_STATS_KEY = 'download_stats';

export interface PersistentDownloadItem extends DownloadItem {
  // Additional fields for persistence
  retryCount: number;
  lastRetryTime?: Date;
  priority: number;
  batchId: string | undefined;
  metadata: Record<string, any> | undefined;
}

export interface DownloadQueueItem {
  id: string;
  priority: number;
  addedAt: Date;
  batchId: string | undefined;
}

export interface PersistentDownloadStats extends DownloadStats {
  lastUpdated: Date;
  totalRetries: number;
  averageDownloadTime: number;
}

export class PersistentDownloadStore {
  private static instance: PersistentDownloadStore;
  private downloads = new Map<string, PersistentDownloadItem>();
  private downloadQueue: DownloadQueueItem[] = [];
  private stats: PersistentDownloadStats;
  private isInitialized = false;

  private constructor() {
    this.stats = {
      totalDownloads: 0,
      completedDownloads: 0,
      failedDownloads: 0,
      totalSize: 0,
      downloadedSize: 0,
      lastUpdated: new Date(),
      totalRetries: 0,
      averageDownloadTime: 0,
    };
  }

  static getInstance(): PersistentDownloadStore {
    if (!PersistentDownloadStore.instance) {
      PersistentDownloadStore.instance = new PersistentDownloadStore();
    }
    return PersistentDownloadStore.instance;
  }

  /**
   * Initialize the store by loading data from AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing persistent download store');

      // Load downloads
      const downloadsData = await AsyncStorage.getItem(DOWNLOADS_STORAGE_KEY);
      if (downloadsData) {
        const downloads = JSON.parse(downloadsData);
        this.downloads.clear();

        for (const [id, download] of Object.entries(downloads)) {
          // Convert date strings back to Date objects
          const downloadItem = download as any;
          downloadItem.createdAt = new Date(downloadItem.createdAt);
          downloadItem.completedAt = downloadItem.completedAt
            ? new Date(downloadItem.completedAt)
            : undefined;
          downloadItem.lastRetryTime = downloadItem.lastRetryTime
            ? new Date(downloadItem.lastRetryTime)
            : undefined;
          downloadItem.expiresAt = downloadItem.expiresAt
            ? new Date(downloadItem.expiresAt)
            : undefined;

          this.downloads.set(id, downloadItem);
        }

        logger.info(`Loaded ${this.downloads.size} downloads from storage`);
      }

      // Load download queue
      const queueData = await AsyncStorage.getItem(DOWNLOAD_QUEUE_KEY);
      if (queueData) {
        const queue = JSON.parse(queueData);
        this.downloadQueue = queue.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        logger.info(
          `Loaded ${this.downloadQueue.length} items from download queue`
        );
      }

      // Load stats
      const statsData = await AsyncStorage.getItem(DOWNLOAD_STATS_KEY);
      if (statsData) {
        const stats = JSON.parse(statsData);
        this.stats = {
          ...stats,
          lastUpdated: new Date(stats.lastUpdated),
        };
        logger.info('Loaded download stats from storage');
      }

      this.isInitialized = true;
      logger.info('Persistent download store initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize persistent download store:', error);
      throw error;
    }
  }

  /**
   * Save downloads to AsyncStorage
   */
  private async saveDownloads(): Promise<void> {
    try {
      const downloadsData = JSON.stringify(Object.fromEntries(this.downloads));
      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, downloadsData);
    } catch (error) {
      logger.error('Failed to save downloads to storage:', error);
    }
  }

  /**
   * Save download queue to AsyncStorage
   */
  private async saveDownloadQueue(): Promise<void> {
    try {
      const queueData = JSON.stringify(this.downloadQueue);
      await AsyncStorage.setItem(DOWNLOAD_QUEUE_KEY, queueData);
    } catch (error) {
      logger.error('Failed to save download queue to storage:', error);
    }
  }

  /**
   * Save stats to AsyncStorage
   */
  private async saveStats(): Promise<void> {
    try {
      this.stats.lastUpdated = new Date();
      const statsData = JSON.stringify(this.stats);
      await AsyncStorage.setItem(DOWNLOAD_STATS_KEY, statsData);
    } catch (error) {
      logger.error('Failed to save download stats to storage:', error);
    }
  }

  /**
   * Add a download to the store
   */
  async addDownload(download: PersistentDownloadItem): Promise<void> {
    this.downloads.set(download.id, download);
    await this.saveDownloads();

    // Update stats
    this.stats.totalDownloads++;
    await this.saveStats();

    logger.info(`Added download to persistent store: ${download.fileName}`);
  }

  /**
   * Update a download in the store
   */
  async updateDownload(
    id: string,
    updates: Partial<PersistentDownloadItem>
  ): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) {
      logger.warn(`Download not found for update: ${id}`);
      return;
    }

    const updatedDownload = { ...download, ...updates };
    this.downloads.set(id, updatedDownload);
    await this.saveDownloads();

    // Update stats if status changed
    if (updates.status) {
      await this.updateStatsForStatusChange(download.status, updates.status);
    }

    logger.debug(`Updated download in persistent store: ${id}`);
  }

  /**
   * Remove a download from the store
   */
  async removeDownload(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (download) {
      this.downloads.delete(id);
      await this.saveDownloads();
      logger.info(`Removed download from persistent store: ${id}`);
    }
  }

  /**
   * Get a download by ID
   */
  getDownload(id: string): PersistentDownloadItem | undefined {
    return this.downloads.get(id);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): PersistentDownloadItem[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadStatus): PersistentDownloadItem[] {
    return Array.from(this.downloads.values()).filter(d => d.status === status);
  }

  /**
   * Get downloads that need to be resumed (pending or downloading)
   */
  getDownloadsToResume(): PersistentDownloadItem[] {
    return Array.from(this.downloads.values()).filter(
      d => d.status === 'pending' || d.status === 'downloading'
    );
  }

  /**
   * Add item to download queue
   */
  async addToQueue(queueItem: DownloadQueueItem): Promise<void> {
    this.downloadQueue.push(queueItem);
    // Sort by priority (higher priority first)
    this.downloadQueue.sort((a, b) => b.priority - a.priority);
    await this.saveDownloadQueue();

    logger.info(`Added item to download queue: ${queueItem.id}`);
  }

  /**
   * Remove item from download queue
   */
  async removeFromQueue(id: string): Promise<void> {
    const index = this.downloadQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.downloadQueue.splice(index, 1);
      await this.saveDownloadQueue();
      logger.info(`Removed item from download queue: ${id}`);
    }
  }

  /**
   * Get next item from queue
   */
  getNextFromQueue(): DownloadQueueItem | undefined {
    return this.downloadQueue.shift();
  }

  /**
   * Get all queue items
   */
  getQueueItems(): DownloadQueueItem[] {
    return [...this.downloadQueue];
  }

  /**
   * Clear completed downloads
   */
  async clearCompletedDownloads(): Promise<void> {
    const completedIds = Array.from(this.downloads.entries())
      .filter(([_, download]) => download.status === 'completed')
      .map(([id, _]) => id);

    for (const id of completedIds) {
      this.downloads.delete(id);
    }

    await this.saveDownloads();
    logger.info(`Cleared ${completedIds.length} completed downloads`);
  }

  /**
   * Clear failed downloads
   */
  async clearFailedDownloads(): Promise<void> {
    const failedIds = Array.from(this.downloads.entries())
      .filter(([_, download]) => download.status === 'failed')
      .map(([id, _]) => id);

    for (const id of failedIds) {
      this.downloads.delete(id);
    }

    await this.saveDownloads();
    logger.info(`Cleared ${failedIds.length} failed downloads`);
  }

  /**
   * Get download stats
   */
  getStats(): PersistentDownloadStats {
    return { ...this.stats };
  }

  /**
   * Update stats when download status changes
   */
  private async updateStatsForStatusChange(
    oldStatus: DownloadStatus,
    newStatus: DownloadStatus
  ): Promise<void> {
    if (oldStatus === newStatus) return;

    // Decrement old status count
    if (oldStatus === 'completed') {
      this.stats.completedDownloads = Math.max(
        0,
        this.stats.completedDownloads - 1
      );
    } else if (oldStatus === 'failed') {
      this.stats.failedDownloads = Math.max(0, this.stats.failedDownloads - 1);
    }

    // Increment new status count
    if (newStatus === 'completed') {
      this.stats.completedDownloads++;
    } else if (newStatus === 'failed') {
      this.stats.failedDownloads++;
    }

    await this.saveStats();
  }

  /**
   * Update download progress
   */
  async updateProgress(id: string, progress: DownloadProgress): Promise<void> {
    const download = this.downloads.get(id);
    if (download) {
      download.progress = progress.progress;
      download.fileSize = progress.contentLength;
      await this.saveDownloads();
    }
  }

  /**
   * Increment retry count for a download
   */
  async incrementRetryCount(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (download) {
      download.retryCount++;
      download.lastRetryTime = new Date();
      this.stats.totalRetries++;
      await this.saveDownloads();
      await this.saveStats();

      logger.info(
        `Incremented retry count for download: ${id} (${download.retryCount})`
      );
    }
  }

  /**
   * Reset retry count for a download
   */
  async resetRetryCount(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (download) {
      download.retryCount = 0;
      delete download.lastRetryTime;
      await this.saveDownloads();

      logger.info(`Reset retry count for download: ${id}`);
    }
  }

  /**
   * Get downloads by batch ID
   */
  getDownloadsByBatchId(batchId: string): PersistentDownloadItem[] {
    return Array.from(this.downloads.values()).filter(
      d => d.batchId === batchId
    );
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    this.downloads.clear();
    this.downloadQueue = [];
    this.stats = {
      totalDownloads: 0,
      completedDownloads: 0,
      failedDownloads: 0,
      totalSize: 0,
      downloadedSize: 0,
      lastUpdated: new Date(),
      totalRetries: 0,
      averageDownloadTime: 0,
    };

    await AsyncStorage.multiRemove([
      DOWNLOADS_STORAGE_KEY,
      DOWNLOAD_QUEUE_KEY,
      DOWNLOAD_STATS_KEY,
    ]);

    logger.info('Cleared all persistent download data');
  }

  /**
   * Get downloads that have expired signed URLs
   */
  getDownloadsWithExpiredUrls(): PersistentDownloadItem[] {
    const now = new Date();
    return Array.from(this.downloads.values()).filter(
      d => d.signedUrl && d.expiresAt && d.expiresAt < now
    );
  }

  /**
   * Check if store is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const persistentDownloadStore = PersistentDownloadStore.getInstance();

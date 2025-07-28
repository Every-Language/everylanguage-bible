import { useState, useEffect, useCallback, useRef } from 'react';
import { downloadService } from '../services/downloadService';
import { DownloadStatus } from '../services/types';
import {
  persistentDownloadStore,
  PersistentDownloadItem,
  DownloadQueueItem,
  PersistentDownloadStats,
} from '../services/persistentDownloadStore';
import { logger } from '@/shared/utils/logger';

export interface UseBackgroundDownloadsReturn {
  // State
  downloads: PersistentDownloadItem[];
  queueItems: DownloadQueueItem[];
  stats: PersistentDownloadStats;
  isInitialized: boolean;
  isProcessing: boolean;

  // Actions
  addToBackgroundQueue: (
    filePath: string,
    fileName: string,
    options?: any
  ) => Promise<string>;
  addBatchToBackgroundQueue: (
    files: Array<{ filePath: string; fileName: string; fileSize?: number }>,
    options?: any
  ) => Promise<string[]>;
  cancelDownload: (downloadId: string) => Promise<void>;
  pauseDownload: (downloadId: string) => Promise<void>;
  resumeDownload: (downloadId: string) => Promise<void>;
  clearCompletedDownloads: () => Promise<void>;
  clearFailedDownloads: () => Promise<void>;
  continueDownloads: () => Promise<void>;

  // Queries
  getDownload: (downloadId: string) => PersistentDownloadItem | undefined;
  getDownloadsByStatus: (status: string) => PersistentDownloadItem[];
  getDownloadsByBatchId: (batchId: string) => PersistentDownloadItem[];
  getContinueDownloadsSummary: () => {
    pendingCount: number;
    failedCount: number;
    totalCount: number;
    canContinue: boolean;
  };

  // Utilities
  refreshDownloads: () => void;
  initialize: () => Promise<void>;
}

/**
 * Hook for managing background downloads - ALWAYS uses background download system
 * This hook provides specialized functionality for background download operations
 * and ensures all downloads go through the background queue system.
 */
export const useBackgroundDownloads = (): UseBackgroundDownloadsReturn => {
  const [downloads, setDownloads] = useState<PersistentDownloadItem[]>([]);
  const [queueItems, setQueueItems] = useState<DownloadQueueItem[]>([]);
  const [stats, setStats] = useState<PersistentDownloadStats>({
    totalDownloads: 0,
    completedDownloads: 0,
    failedDownloads: 0,
    totalSize: 0,
    downloadedSize: 0,
    lastUpdated: new Date(),
    totalRetries: 0,
    averageDownloadTime: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize the background download service
  const initialize = useCallback(async () => {
    try {
      await downloadService.initialize();
      setIsInitialized(true);
      refreshDownloads();
      startRefreshInterval();
    } catch (error) {
      logger.error('Failed to initialize background downloads:', error);
    }
  }, []);

  // Refresh downloads data
  const refreshDownloads = useCallback(() => {
    if (!downloadService.initialized) return;

    try {
      const allDownloads = downloadService.getAllDownloads();
      const queueItems = persistentDownloadStore.getQueueItems();
      const currentStats = downloadService.getStats();
      const processing = downloadService.processing;

      setDownloads(allDownloads);
      setQueueItems(queueItems);
      setStats({
        ...currentStats,
        lastUpdated: new Date(),
        totalRetries: 0, // This would need to be calculated from downloads
        averageDownloadTime: 0, // This would need to be calculated from downloads
      });
      setIsProcessing(processing);
    } catch (error) {
      logger.error('Error refreshing downloads:', error);
    }
  }, []);

  // Start refresh interval
  const startRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshDownloads();
    }, 1000); // Refresh every second
  }, [refreshDownloads]);

  // Stop refresh interval
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRefreshInterval();
    };
  }, [stopRefreshInterval]);

  // Add to background queue
  const addToBackgroundQueue = useCallback(
    async (
      filePath: string,
      fileName: string,
      options: any = {}
    ): Promise<string> => {
      try {
        const downloadId = await downloadService.addToQueue(
          filePath,
          fileName,
          options
        );
        refreshDownloads();
        return downloadId;
      } catch (error) {
        logger.error('Failed to add to background queue:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Add batch to background queue
  const addBatchToBackgroundQueue = useCallback(
    async (
      files: Array<{ filePath: string; fileName: string; fileSize?: number }>,
      options: any = {}
    ): Promise<string[]> => {
      try {
        const downloadIds = await downloadService.addBatchToQueue(
          files,
          options
        );
        refreshDownloads();
        return downloadIds;
      } catch (error) {
        logger.error('Failed to add batch to background queue:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Cancel download
  const cancelDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await downloadService.cancelDownload(downloadId);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to cancel download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Pause download
  const pauseDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await downloadService.pauseDownload(downloadId);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to pause download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Resume download
  const resumeDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await downloadService.resumeDownload(downloadId);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to resume download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Clear completed downloads
  const clearCompletedDownloads = useCallback(async (): Promise<void> => {
    try {
      await downloadService.clearCompletedDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to clear completed downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Clear failed downloads
  const clearFailedDownloads = useCallback(async (): Promise<void> => {
    try {
      await downloadService.clearFailedDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to clear failed downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Continue downloads
  const continueDownloads = useCallback(async (): Promise<void> => {
    try {
      await downloadService.continueDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to continue downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Get download by ID
  const getDownload = useCallback(
    (downloadId: string): PersistentDownloadItem | undefined => {
      return downloadService.getDownloadStatus(downloadId);
    },
    []
  );

  // Get downloads by status
  const getDownloadsByStatus = useCallback(
    (status: string): PersistentDownloadItem[] => {
      return downloadService.getDownloadsByStatus(status as DownloadStatus);
    },
    []
  );

  // Get downloads by batch ID
  const getDownloadsByBatchId = useCallback(
    (batchId: string): PersistentDownloadItem[] => {
      return persistentDownloadStore.getDownloadsByBatchId(batchId);
    },
    []
  );

  // Get continue downloads summary
  const getContinueDownloadsSummary = useCallback(() => {
    return downloadService.getContinueDownloadsSummary();
  }, []);

  return {
    // State
    downloads,
    queueItems,
    stats,
    isInitialized,
    isProcessing,

    // Actions
    addToBackgroundQueue,
    addBatchToBackgroundQueue,
    cancelDownload,
    pauseDownload,
    resumeDownload,
    clearCompletedDownloads,
    clearFailedDownloads,
    continueDownloads,

    // Queries
    getDownload,
    getDownloadsByStatus,
    getDownloadsByBatchId,
    getContinueDownloadsSummary,

    // Utilities
    refreshDownloads,
    initialize,
  };
};

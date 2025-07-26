import { useState, useEffect, useCallback, useRef } from 'react';
import {
  backgroundDownloadService,
  BackgroundDownloadOptions,
} from '../services/backgroundDownloadService';
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
    options?: BackgroundDownloadOptions
  ) => Promise<string>;
  addBatchToBackgroundQueue: (
    files: Array<{ filePath: string; fileName: string }>,
    options?: BackgroundDownloadOptions
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
      await backgroundDownloadService.initialize();
      setIsInitialized(true);
      refreshDownloads();
      startRefreshInterval();
    } catch (error) {
      logger.error('Failed to initialize background downloads:', error);
    }
  }, []);

  // Refresh downloads data
  const refreshDownloads = useCallback(() => {
    if (!backgroundDownloadService.initialized) return;

    try {
      const allDownloads = backgroundDownloadService.getAllDownloads();
      const queueItems = persistentDownloadStore.getQueueItems();
      const currentStats = backgroundDownloadService.getStats();
      const processing = backgroundDownloadService.processing;

      setDownloads(allDownloads);
      setQueueItems(queueItems);
      setStats(currentStats);
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

    // Refresh every 2 seconds to get real-time updates
    refreshIntervalRef.current = setInterval(() => {
      refreshDownloads();
    }, 2000);
  }, [refreshDownloads]);

  // Stop refresh interval
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Add single download to background queue
  const addToBackgroundQueue = useCallback(
    async (
      filePath: string,
      fileName: string,
      options: BackgroundDownloadOptions = {}
    ): Promise<string> => {
      try {
        const downloadId = await backgroundDownloadService.addToBackgroundQueue(
          filePath,
          fileName,
          options
        );

        // Refresh immediately to show the new download
        setTimeout(refreshDownloads, 100);

        return downloadId;
      } catch (error) {
        logger.error('Failed to add download to background queue:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Add batch of downloads to background queue
  const addBatchToBackgroundQueue = useCallback(
    async (
      files: Array<{ filePath: string; fileName: string }>,
      options: BackgroundDownloadOptions = {}
    ): Promise<string[]> => {
      try {
        const downloadIds =
          await backgroundDownloadService.addBatchToBackgroundQueue(
            files,
            options
          );

        // Refresh immediately to show the new downloads
        setTimeout(refreshDownloads, 100);

        return downloadIds;
      } catch (error) {
        logger.error('Failed to add batch to background queue:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Cancel a download
  const cancelDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await backgroundDownloadService.cancelDownload(downloadId);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to cancel download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Pause a download
  const pauseDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await backgroundDownloadService.pauseDownload(downloadId);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to pause download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  // Resume a download
  const resumeDownload = useCallback(
    async (downloadId: string): Promise<void> => {
      try {
        await backgroundDownloadService.resumeDownload(downloadId);
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
      await backgroundDownloadService.clearCompletedDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to clear completed downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Clear failed downloads
  const clearFailedDownloads = useCallback(async (): Promise<void> => {
    try {
      await backgroundDownloadService.clearFailedDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to clear failed downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Continue downloads
  const continueDownloads = useCallback(async (): Promise<void> => {
    try {
      await backgroundDownloadService.continueDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to continue downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  // Get download by ID
  const getDownload = useCallback(
    (downloadId: string): PersistentDownloadItem | undefined => {
      return backgroundDownloadService.getDownloadStatus(downloadId);
    },
    []
  );

  // Get downloads by status
  const getDownloadsByStatus = useCallback(
    (status: string): PersistentDownloadItem[] => {
      return backgroundDownloadService.getDownloadsByStatus(
        status as DownloadStatus
      );
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
    return backgroundDownloadService.getContinueDownloadsSummary();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();

    return () => {
      stopRefreshInterval();
    };
  }, [initialize, stopRefreshInterval]);

  // Start refresh interval when initialized
  useEffect(() => {
    if (isInitialized) {
      startRefreshInterval();
    }
  }, [isInitialized, startRefreshInterval]);

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

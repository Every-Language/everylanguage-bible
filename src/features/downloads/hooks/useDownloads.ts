import { useState, useCallback, useEffect } from 'react';
import { downloadService } from '../services/downloadService';
import {
  DownloadItem,
  DownloadStatus,
  DownloadOptions,
  DownloadStats,
} from '../services/types';
import { DownloadToMediaOptions } from '../services/downloadToMediaService';
import { logger } from '@/shared/utils/logger';

export interface UseDownloadsReturn {
  // State
  downloads: DownloadItem[];
  isLoading: boolean;
  error: string | null;
  stats: DownloadStats;

  // Actions
  downloadFile: (
    filePath: string,
    fileName: string,
    options?: DownloadOptions & {
      addToMediaFiles?: boolean;
      originalSearchResult?: any;
      mediaFileOptions?: DownloadToMediaOptions;
    }
  ) => Promise<DownloadItem>;
  downloadBatch: (
    files: Array<{ filePath: string; fileName: string }>,
    options?: DownloadOptions & {
      addToMediaFiles?: boolean;
      originalSearchResults?: any[];
      mediaFileOptions?: DownloadToMediaOptions;
    }
  ) => Promise<void>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  clearCompletedDownloads: () => Promise<void>;

  // Queries
  getDownload: (id: string) => DownloadItem | undefined;
  getDownloadsByStatus: (status: DownloadStatus) => DownloadItem[];
  isDownloadActive: (id: string) => boolean;

  // Statistics
  getActiveDownloadsCount: () => number;
  getPendingDownloadsCount: () => number;
  getCompletedDownloadsCount: () => number;
  getFailedDownloadsCount: () => number;
  getTotalDownloadedSize: () => number;
  getTotalDownloadSize: () => number;

  // Utilities
  refreshDownloads: () => void;
  clearError: () => void;
}

/**
 * Hook for managing downloads - ALWAYS uses background download system
 * All downloads go through the background queue for consistency and reliability.
 */
export const useDownloads = (): UseDownloadsReturn => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DownloadStats>({
    totalDownloads: 0,
    completedDownloads: 0,
    failedDownloads: 0,
    totalSize: 0,
    downloadedSize: 0,
  });

  // Refresh downloads data
  const refreshDownloads = useCallback(() => {
    try {
      const allDownloads = downloadService.getAllDownloads();
      const downloadStats = downloadService.getStats();

      // Convert PersistentDownloadItem to DownloadItem for compatibility
      const convertedDownloads: DownloadItem[] = allDownloads.map(download => {
        const item: DownloadItem = {
          id: download.id,
          filePath: download.filePath,
          fileName: download.fileName,
          localPath: download.localPath,
          status: download.status,
          progress: download.progress,
          createdAt: download.createdAt,
        };

        // Add optional properties only if they exist
        if (download.fileSize !== undefined) {
          item.fileSize = download.fileSize;
        }
        if (download.completedAt !== undefined) {
          item.completedAt = download.completedAt;
        }
        if (download.error !== undefined) {
          item.error = download.error;
        }
        if (download.signedUrl !== undefined) {
          item.signedUrl = download.signedUrl;
        }
        if (download.expiresAt !== undefined) {
          item.expiresAt = download.expiresAt;
        }

        return item;
      });

      setDownloads(convertedDownloads);
      setStats(downloadStats);
    } catch (error) {
      logger.error('Error refreshing downloads:', error);
    }
  }, []);

  // Initialize downloads on mount
  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  /**
   * Download a single file (ALWAYS uses background queue)
   */
  const downloadFile = useCallback(
    async (
      filePath: string,
      fileName: string,
      options: DownloadOptions & {
        addToMediaFiles?: boolean;
        originalSearchResult?: any;
        mediaFileOptions?: DownloadToMediaOptions;
      } = {}
    ): Promise<DownloadItem> => {
      setIsLoading(true);
      setError(null);

      const {
        addToMediaFiles = false,
        originalSearchResult,
        mediaFileOptions = {},
        ...downloadOptions
      } = options;

      try {
        // ALWAYS use background queue - never perform direct downloads
        const downloadId = await downloadService.addToQueue(
          filePath,
          fileName,
          {
            ...downloadOptions,
            addToMediaFiles,
            ...(originalSearchResult && {
              originalSearchResults: [originalSearchResult],
            }),
            mediaFileOptions,
          }
        );

        const downloadItem = downloadService.getDownloadStatus(downloadId);
        if (!downloadItem) {
          throw new Error('Failed to create download item');
        }

        // Convert PersistentDownloadItem to DownloadItem for compatibility
        const item: DownloadItem = {
          id: downloadItem.id,
          filePath: downloadItem.filePath,
          fileName: downloadItem.fileName,
          localPath: downloadItem.localPath,
          status: downloadItem.status,
          progress: downloadItem.progress,
          createdAt: downloadItem.createdAt,
        };

        // Add optional properties only if they exist
        if (downloadItem.fileSize !== undefined) {
          item.fileSize = downloadItem.fileSize;
        }
        if (downloadItem.completedAt !== undefined) {
          item.completedAt = downloadItem.completedAt;
        }
        if (downloadItem.error !== undefined) {
          item.error = downloadItem.error;
        }
        if (downloadItem.signedUrl !== undefined) {
          item.signedUrl = downloadItem.signedUrl;
        }
        if (downloadItem.expiresAt !== undefined) {
          item.expiresAt = downloadItem.expiresAt;
        }

        refreshDownloads();
        return item;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Download failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDownloads]
  );

  /**
   * Download multiple files (ALWAYS uses background queue)
   */
  const downloadBatch = useCallback(
    async (
      files: Array<{ filePath: string; fileName: string }>,
      options: DownloadOptions & {
        addToMediaFiles?: boolean;
        originalSearchResults?: any[];
        mediaFileOptions?: DownloadToMediaOptions;
      } = {}
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const {
        addToMediaFiles = false,
        originalSearchResults = [],
        mediaFileOptions = {},
        ...downloadOptions
      } = options;

      try {
        // ALWAYS use background queue - never perform direct downloads
        const downloadIds = await downloadService.addBatchToQueue(files, {
          ...downloadOptions,
          addToMediaFiles,
          originalSearchResults,
          mediaFileOptions,
        });

        logger.info('Added batch downloads to background queue:', {
          count: downloadIds.length,
          addToMediaFiles,
        });

        refreshDownloads();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Batch download failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDownloads]
  );

  const pauseDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await downloadService.pauseDownload(id);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to pause download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  const resumeDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await downloadService.resumeDownload(id);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to resume download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  const cancelDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await downloadService.cancelDownload(id);
        refreshDownloads();
      } catch (error) {
        logger.error('Failed to cancel download:', error);
        throw error;
      }
    },
    [refreshDownloads]
  );

  const clearCompletedDownloads = useCallback(async (): Promise<void> => {
    try {
      await downloadService.clearCompletedDownloads();
      refreshDownloads();
    } catch (error) {
      logger.error('Failed to clear completed downloads:', error);
      throw error;
    }
  }, [refreshDownloads]);

  const getDownload = useCallback((id: string): DownloadItem | undefined => {
    const download = downloadService.getDownloadStatus(id);
    if (!download) return undefined;

    const item: DownloadItem = {
      id: download.id,
      filePath: download.filePath,
      fileName: download.fileName,
      localPath: download.localPath,
      status: download.status,
      progress: download.progress,
      createdAt: download.createdAt,
    };

    // Add optional properties only if they exist
    if (download.fileSize !== undefined) {
      item.fileSize = download.fileSize;
    }
    if (download.completedAt !== undefined) {
      item.completedAt = download.completedAt;
    }
    if (download.error !== undefined) {
      item.error = download.error;
    }
    if (download.signedUrl !== undefined) {
      item.signedUrl = download.signedUrl;
    }
    if (download.expiresAt !== undefined) {
      item.expiresAt = download.expiresAt;
    }

    return item;
  }, []);

  const getDownloadsByStatus = useCallback(
    (status: DownloadStatus): DownloadItem[] => {
      const downloads = downloadService.getDownloadsByStatus(status);
      return downloads.map(download => {
        const item: DownloadItem = {
          id: download.id,
          filePath: download.filePath,
          fileName: download.fileName,
          localPath: download.localPath,
          status: download.status,
          progress: download.progress,
          createdAt: download.createdAt,
        };

        // Add optional properties only if they exist
        if (download.fileSize !== undefined) {
          item.fileSize = download.fileSize;
        }
        if (download.completedAt !== undefined) {
          item.completedAt = download.completedAt;
        }
        if (download.error !== undefined) {
          item.error = download.error;
        }
        if (download.signedUrl !== undefined) {
          item.signedUrl = download.signedUrl;
        }
        if (download.expiresAt !== undefined) {
          item.expiresAt = download.expiresAt;
        }

        return item;
      });
    },
    []
  );

  const isDownloadActive = useCallback((id: string): boolean => {
    const download = downloadService.getDownloadStatus(id);
    return download?.status === 'downloading';
  }, []);

  const getActiveDownloadsCount = useCallback((): number => {
    return downloadService.getDownloadsByStatus('downloading').length;
  }, []);

  const getPendingDownloadsCount = useCallback((): number => {
    return downloadService.getDownloadsByStatus('pending').length;
  }, []);

  const getCompletedDownloadsCount = useCallback((): number => {
    return downloadService.getDownloadsByStatus('completed').length;
  }, []);

  const getFailedDownloadsCount = useCallback((): number => {
    return downloadService.getDownloadsByStatus('failed').length;
  }, []);

  const getTotalDownloadedSize = useCallback((): number => {
    const completedDownloads =
      downloadService.getDownloadsByStatus('completed');
    return completedDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  }, []);

  const getTotalDownloadSize = useCallback((): number => {
    const allDownloads = downloadService.getAllDownloads();
    return allDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    downloads,
    isLoading,
    error,
    stats,

    // Actions
    downloadFile,
    downloadBatch,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    clearCompletedDownloads,

    // Queries
    getDownload,
    getDownloadsByStatus,
    isDownloadActive,

    // Statistics
    getActiveDownloadsCount,
    getPendingDownloadsCount,
    getCompletedDownloadsCount,
    getFailedDownloadsCount,
    getTotalDownloadedSize,
    getTotalDownloadSize,

    // Utilities
    refreshDownloads,
    clearError,
  };
};

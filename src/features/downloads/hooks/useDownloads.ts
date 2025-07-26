import { useState, useEffect, useCallback } from 'react';
import { downloadService } from '../services';
import {
  DownloadItem,
  DownloadStatus,
  DownloadProgress,
  DownloadOptions,
  DownloadStats,
} from '../services/types';

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
    options?: DownloadOptions
  ) => Promise<DownloadItem>;
  downloadBatch: (
    files: Array<{ filePath: string; fileName: string }>,
    options?: DownloadOptions
  ) => Promise<void>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<DownloadItem>;
  cancelDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
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
}

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

  // Load downloads and stats on mount
  useEffect(() => {
    refreshDownloads();
  }, []);

  const refreshDownloads = useCallback(() => {
    const allDownloads = downloadService.getAllDownloads();
    const downloadStats = downloadService.getDownloadStats();

    setDownloads(allDownloads);
    setStats(downloadStats);
  }, []);

  const downloadFile = useCallback(
    async (
      filePath: string,
      fileName: string,
      options: DownloadOptions = {}
    ): Promise<DownloadItem> => {
      setIsLoading(true);
      setError(null);

      try {
        const downloadItem = await downloadService.downloadFile(
          filePath,
          fileName,
          {
            ...options,
            onProgress: (progress: DownloadProgress) => {
              // Update the download progress in state
              setDownloads(prev =>
                prev.map(d =>
                  d.filePath === filePath
                    ? {
                        ...d,
                        progress: progress.progress,
                        fileSize: progress.contentLength,
                      }
                    : d
                )
              );
              options.onProgress?.(progress);
            },
            onComplete: (item: DownloadItem) => {
              setDownloads(prev =>
                prev.map(d => (d.id === item.id ? item : d))
              );
              refreshDownloads(); // Refresh stats
              options.onComplete?.(item);
            },
            onError: (errorMsg: string) => {
              setError(errorMsg);
              refreshDownloads(); // Refresh stats
              options.onError?.(errorMsg);
            },
          }
        );

        setDownloads(prev => [...prev, downloadItem]);
        return downloadItem;
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Download failed';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDownloads]
  );

  const downloadBatch = useCallback(
    async (
      files: Array<{ filePath: string; fileName: string }>,
      options: DownloadOptions = {}
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await downloadService.downloadBatch(files, options);
        refreshDownloads(); // Reload all downloads after batch operation
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Batch download failed';
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
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Failed to pause download';
        setError(errorMsg);
        throw err;
      }
    },
    [refreshDownloads]
  );

  const resumeDownload = useCallback(
    async (id: string): Promise<DownloadItem> => {
      try {
        const download = await downloadService.resumeDownload(id);
        refreshDownloads();
        return download;
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Failed to resume download';
        setError(errorMsg);
        throw err;
      }
    },
    [refreshDownloads]
  );

  const cancelDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await downloadService.cancelDownload(id);
        refreshDownloads();
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Failed to cancel download';
        setError(errorMsg);
        throw err;
      }
    },
    [refreshDownloads]
  );

  const deleteDownload = useCallback(
    async (id: string): Promise<void> => {
      try {
        await downloadService.deleteDownload(id);
        refreshDownloads();
      } catch (err: unknown) {
        const errorMsg = (err as any)?.message || 'Failed to delete download';
        setError(errorMsg);
        throw err;
      }
    },
    [refreshDownloads]
  );

  const clearCompletedDownloads = useCallback(async (): Promise<void> => {
    try {
      await downloadService.clearCompletedDownloads();
      refreshDownloads();
    } catch (err: unknown) {
      const errorMsg =
        (err as any)?.message || 'Failed to clear completed downloads';
      setError(errorMsg);
      throw err;
    }
  }, [refreshDownloads]);

  const getDownload = useCallback((id: string): DownloadItem | undefined => {
    return downloadService.getDownload(id);
  }, []);

  const getDownloadsByStatus = useCallback(
    (status: DownloadStatus): DownloadItem[] => {
      return downloadService.getDownloadsByStatus(status);
    },
    []
  );

  const isDownloadActive = useCallback((id: string): boolean => {
    return downloadService.isDownloadActive(id);
  }, []);

  const getActiveDownloadsCount = useCallback((): number => {
    return downloadService.getActiveDownloadsCount();
  }, []);

  const getPendingDownloadsCount = useCallback((): number => {
    return downloadService.getPendingDownloadsCount();
  }, []);

  const getCompletedDownloadsCount = useCallback((): number => {
    return downloadService.getCompletedDownloadsCount();
  }, []);

  const getFailedDownloadsCount = useCallback((): number => {
    return downloadService.getFailedDownloadsCount();
  }, []);

  const getTotalDownloadedSize = useCallback((): number => {
    return downloadService.getTotalDownloadedSize();
  }, []);

  const getTotalDownloadSize = useCallback((): number => {
    return downloadService.getTotalDownloadSize();
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
    deleteDownload,
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
  };
};

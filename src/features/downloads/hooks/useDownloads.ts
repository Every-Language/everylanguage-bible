import { useState, useEffect, useCallback } from 'react';
import { downloadService } from '../services';
import {
  DownloadItem,
  DownloadStatus,
  DownloadProgress,
  DownloadOptions,
} from '../types';

export const useDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load downloads on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = useCallback(() => {
    const allDownloads = downloadService.getAllDownloads();
    setDownloads(allDownloads);
  }, []);

  const downloadFile = useCallback(
    async (
      filePath: string,
      fileName: string,
      options: DownloadOptions = {}
    ) => {
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
              options.onComplete?.(item);
            },
            onError: (errorMsg: string) => {
              setError(errorMsg);
              options.onError?.(errorMsg);
            },
          }
        );

        setDownloads(prev => [...prev, downloadItem]);
        return downloadItem;
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const downloadBatch = useCallback(
    async (
      files: Array<{ filePath: string; fileName: string }>,
      options: DownloadOptions = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await downloadService.downloadBatch(files, options);
        loadDownloads(); // Reload all downloads after batch operation
        return result;
      } catch (err) {
        const errorMsg = (err as Error).message;
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadDownloads]
  );

  const pauseDownload = useCallback(
    async (id: string) => {
      try {
        await downloadService.pauseDownload(id);
        loadDownloads();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [loadDownloads]
  );

  const resumeDownload = useCallback(async (id: string) => {
    try {
      const downloadItem = await downloadService.resumeDownload(id);
      setDownloads(prev => prev.map(d => (d.id === id ? downloadItem : d)));
      return downloadItem;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const cancelDownload = useCallback(
    async (id: string) => {
      try {
        await downloadService.cancelDownload(id);
        loadDownloads();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [loadDownloads]
  );

  const deleteDownload = useCallback(async (id: string) => {
    try {
      await downloadService.deleteDownload(id);
      setDownloads(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const clearCompletedDownloads = useCallback(async () => {
    try {
      await downloadService.clearCompletedDownloads();
      loadDownloads();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [loadDownloads]);

  const getDownloadsByStatus = useCallback(
    (status: DownloadStatus) => {
      return downloads.filter(download => download.status === status);
    },
    [downloads]
  );

  const getDownloadStats = useCallback(() => {
    return downloadService.getDownloadStats();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    downloads,
    isLoading,
    error,
    downloadFile,
    downloadBatch,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearCompletedDownloads,
    getDownloadsByStatus,
    getDownloadStats,
    clearError,
    refresh: loadDownloads,
  };
};
